# Firebase Schema - Quick Reference Card

---

## Golden Rules

1. ✅ **EVERY document MUST have `mythology` field**
2. ✅ **ALL content types share identical base schema**
3. ✅ **One collection per content type** (NOT per mythology)
4. ✅ **Document IDs:** `{mythology}_{name}` (e.g., `greek_zeus`)

---

## Base Schema Template

```javascript
{
  // IDENTITY (Required)
  id: "greek_zeus",
  name: "Zeus",
  displayName: "⚡ Zeus",

  // CLASSIFICATION (Required)
  mythology: "greek",           // REQUIRED
  contentType: "deity",         // REQUIRED

  // CONTENT
  description: "King of gods...",

  // METADATA (Required)
  metadata: {
    createdAt: Timestamp,
    updatedAt: Timestamp,
    createdBy: "system",
    source: "html_parser",
    verified: true
  },

  // DISCOVERY
  searchTokens: ["zeus", "thunder", "sky"],
  tags: ["olympian", "major"],
  qualityScore: 95,
  relatedIds: ["greek_hera", "greek_athena"],

  // CONTENT-SPECIFIC FIELDS GO HERE
  // (domains, symbols, feats, abilities, etc.)
}
```

---

## Collections

| Collection | ContentType | Example ID |
|------------|-------------|------------|
| `/deities` | `"deity"` | `greek_zeus` |
| `/heroes` | `"hero"` | `greek_achilles` |
| `/creatures` | `"creature"` | `greek_medusa` |
| `/cosmology` | `"cosmology"` | `greek_afterlife` |
| `/texts` | `"text"` | `greek_iliad` |
| `/herbs` | `"herb"` | `greek_laurel` |
| `/rituals` | `"ritual"` | `greek_eleusinian-mysteries` |
| `/symbols` | `"symbol"` | `greek_caduceus` |
| `/concepts` | `"concept"` | `greek_hubris` |
| `/myths` | `"myth"` | `greek_pandoras-box` |
| `/events` | `"event"` | `greek_titanomachy` |

---

## Content-Specific Field Reference

### Deities
```
domains[], symbols[], archetypes[], epithets[],
relationships{parents, consort, children}
```

### Heroes
```
feats[], quests[], weapons[], companions[],
relationships{parents, spouse, allies}
```

### Creatures
```
type, abilities[], weaknesses[], slainBy[]
```

### Cosmology
```
type, layers[], inhabitants[], ruledBy[]
```

### Texts
```
type, author, dateComposed, language, chapters
```

### Herbs
```
scientificName, uses[], properties[], preparation[]
```

### Rituals
```
type, purpose, participants, steps[], deities[]
```

### Symbols
```
type, meanings[], usedBy[], svgPath
```

### Concepts
```
type, relatedConcepts[], parallels{}
```

### Myths
```
type, characters[], summary, themes[]
```

### Events
```
type, participants[], chronologicalOrder, consequences[]
```

---

## Common Queries

```javascript
// All Greek deities
db.collection('deities')
  .where('mythology', '==', 'greek')
  .get()

// All sky-father deities (cross-mythology)
db.collection('deities')
  .where('archetypes', 'array-contains', 'sky-father')
  .get()

// High-quality verified content
db.collection('deities')
  .where('metadata.verified', '==', true)
  .where('qualityScore', '>', 80)
  .get()

// Search for "thunder"
db.collection('deities')
  .where('searchTokens', 'array-contains', 'thunder')
  .get()
```

---

## Required Indexes

```javascript
// Every collection needs:
[mythology, name]
[mythology, qualityScore]
[metadata.verified, qualityScore]
[searchTokens (array-contains)]

// Deities specific:
[mythology, archetypes (array-contains)]

// Events specific:
[mythology, chronologicalOrder]
```

---

## Validation Checklist

Before uploading a document:

- [ ] Has `id` field
- [ ] Has `name` field
- [ ] Has `displayName` field
- [ ] Has `mythology` field (REQUIRED)
- [ ] Has `contentType` field (REQUIRED)
- [ ] Has `description` field (can be empty string)
- [ ] Has `metadata` object with all required fields
- [ ] Has `searchTokens` array
- [ ] Has `tags` array
- [ ] Has `qualityScore` number
- [ ] ID follows convention: `{mythology}_{name}`
- [ ] All content-specific fields are valid

---

## Quality Score Formula

```
Total = 100 points

Field completeness:  40 points
Description length:  20 points
Relationships:       15 points
Primary sources:     15 points
Verified status:     10 points
```

---

## Security Rules Pattern

```javascript
match /{collection}/{docId} {
  allow read: if true;
  allow write: if isAdmin() && hasValidBaseSchema();
}

function hasValidBaseSchema() {
  return request.resource.data.keys()
    .hasAll(['id', 'name', 'mythology', 'contentType', 'metadata'])
    && request.resource.data.mythology is string
    && request.resource.data.contentType is string;
}
```

---

## DO's and DON'Ts

### ✅ DO
- Include `mythology` field on EVERY document
- Use consistent `contentType` values
- Generate `searchTokens` from all searchable text
- Calculate `qualityScore` based on completeness
- Use standardized ID format
- Include `metadata` object with all fields
- Validate before uploading

### ❌ DON'T
- Create mythology-specific collections (NO `greek_deities`)
- Mix content types in one collection
- Omit required base fields
- Use inconsistent field names
- Skip quality score calculation
- Forget to update searchTokens
- Deploy without index creation

---

## File Locations

- **Full Schema:** `/FIREBASE/CENTRALIZED_SCHEMA.md`
- **Summary:** `/FIREBASE/CENTRALIZED_SCHEMA_SUMMARY.md`
- **This Card:** `/FIREBASE/SCHEMA_QUICK_REFERENCE.md`

---

**Print this card and keep it handy!**

Version 1.0 | 2025-12-13
