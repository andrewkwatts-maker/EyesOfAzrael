# Centralized Schema Summary

**Quick Reference Guide**

---

## Key Principles

1. **Every document MUST have `mythology` field**
2. **All content types share identical base schema**
3. **One collection per content type** (not per mythology)
4. **Content-specific fields extend base schema**

---

## Base Schema (Required on ALL documents)

```typescript
{
  // Identity
  id: string;                    // "greek_zeus"
  name: string;                  // "Zeus"
  displayName: string;           // "⚡ Zeus"

  // Classification (REQUIRED)
  mythology: string;             // "greek" | "norse" | "hindu" | etc.
  contentType: string;           // "deity" | "hero" | "creature" | etc.

  // Content
  description: string;

  // Metadata (REQUIRED)
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;           // "system" | "admin" | userUID
    source: string;              // "html_parser" | "user_submission"
    verified: boolean;
    sourceFile?: string;
  };

  // Discovery
  searchTokens: string[];
  tags: string[];
  qualityScore: number;          // 0-100
  relatedIds: string[];
}
```

---

## Collections Structure

```
/deities/{deityId}          - All deities from all mythologies
/heroes/{heroId}            - All heroes from all mythologies
/creatures/{creatureId}     - All creatures from all mythologies
/cosmology/{cosmologyId}    - All realms/places from all mythologies
/texts/{textId}             - All sacred texts from all mythologies
/herbs/{herbId}             - All sacred plants from all mythologies
/rituals/{ritualId}         - All rituals from all mythologies
/symbols/{symbolId}         - All symbols from all mythologies
/concepts/{conceptId}       - All concepts from all mythologies
/myths/{mythId}             - All myth narratives from all mythologies
/events/{eventId}           - All events from all mythologies
```

---

## Content-Specific Fields

### Deities
```typescript
domains: string[];           // ["sky", "thunder"]
symbols: string[];           // ["lightning bolt", "eagle"]
archetypes: string[];        // ["sky-father"]
relationships: object;       // parents, consort, children, etc.
```

### Heroes
```typescript
feats: string[];            // Famous accomplishments
quests: string[];           // Major quests
weapons: string[];          // Famous weapons
relationships: object;      // parents, spouse, allies, etc.
```

### Creatures
```typescript
type: string;               // "monster", "spirit", "beast"
abilities: string[];        // Special powers
weaknesses: string[];       // Known weaknesses
slainBy?: string[];         // Hero IDs
```

### Cosmology
```typescript
type: string;               // "realm", "place", "afterlife"
layers?: string[];          // Hierarchical structure
inhabitants: string[];      // Deity/creature IDs
ruledBy?: string[];         // Deity IDs
```

### Texts
```typescript
type: string;               // "epic", "scripture", "hymn"
author?: string;
dateComposed?: string;
language: string;
chapters?: number;
```

### Herbs
```typescript
scientificName?: string;
uses: string[];             // Ritual/medicinal uses
properties: string[];       // Magical properties
preparation: string[];      // How to prepare
associatedDeities?: string[];
```

### Rituals
```typescript
type: string;               // "ceremony", "mystery", "festival"
purpose: string;
participants: string;
steps: Array<object>;       // Procedure steps
deities?: string[];         // Honored deities
```

### Symbols
```typescript
type: string;               // "geometric", "sigil", "icon"
meanings: string[];
usedBy?: string[];          // Deity/practitioner IDs
svgPath?: string;
```

### Concepts
```typescript
type: string;               // "philosophical", "cosmological"
relatedConcepts: string[];
parallels?: object;         // Cross-mythology parallels
```

### Myths
```typescript
type: string;               // "origin", "hero-journey"
characters: string[];       // Deity/hero IDs
summary: string;
themes: string[];
```

### Events
```typescript
type: string;               // "battle", "creation", "catastrophe"
participants: string[];     // Deity/hero IDs
chronologicalOrder?: number;
consequences: string[];
```

---

## Common Query Patterns

```javascript
// Get all content for a mythology
db.collection('deities').where('mythology', '==', 'greek').get();

// Get all sky-father deities across mythologies
db.collection('deities')
  .where('archetypes', 'array-contains', 'sky-father')
  .get();

// Get high-quality verified content
db.collection('deities')
  .where('metadata.verified', '==', true)
  .where('qualityScore', '>', 80)
  .get();

// Search by tokens
db.collection('deities')
  .where('searchTokens', 'array-contains', 'thunder')
  .get();
```

---

## Document ID Convention

Format: `{mythology}_{name}` (lowercase, hyphenated)

Examples:
- `greek_zeus`
- `norse_odin`
- `hindu_shiva`
- `egyptian_book-of-the-dead`
- `greek_eleusinian-mysteries`

---

## Quality Score Calculation

**Components:**
- Field completeness: 40%
- Description length: 20%
- Relationships count: 15%
- Primary sources: 15%
- Verified status: 10%

**Formula:**
```javascript
score = (requiredFieldsPresent / totalRequired) * 40
      + (descriptionScore) * 20
      + min(relationshipCount * 3, 15)
      + min(sourceCount * 5, 15)
      + (verified ? 10 : 0)
```

---

## Migration Path

1. **Validate** - Check current data against schema
2. **Transform** - Convert to new schema format
3. **Upload** - Batch upload to Firestore
4. **Index** - Create composite indexes
5. **Secure** - Deploy security rules
6. **Update** - Modify frontend queries
7. **Monitor** - Track performance

---

## Benefits

1. **Consistency** - All content follows same structure
2. **Scalability** - Easy to add new mythologies
3. **Queryability** - Powerful cross-mythology queries
4. **Maintainability** - Single source of truth
5. **Quality** - Built-in quality metrics
6. **Search** - Optimized for full-text search

---

## Full Documentation

See `CENTRALIZED_SCHEMA.md` for complete details including:
- Full TypeScript interfaces
- All content-specific schemas
- Complete index requirements
- Detailed security rules
- Step-by-step migration guide
- Query examples
- Code samples

---

**Status:** Design Complete - Not Yet Implemented
**Version:** 1.0
**Date:** 2025-12-13
