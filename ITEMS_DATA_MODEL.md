# Sacred Items Data Model - Enriched Schema

## Overview

This document describes the enriched data model for sacred items in the Eyes of Azrael database. All items have been enriched with 6 new metadata fields that provide comprehensive information about magical properties, users, origins, composition, meaning, and locations.

## Base Item Schema

### Root Level Fields

```typescript
{
  // Identity
  id: string;                          // Unique identifier (e.g., "gungnir")
  name: string;                        // Display name
  type: string;                        // Always "item"
  itemType: string;                    // Specific type (weapon, artifact, etc.)
  slug: string;                        // URL-friendly identifier

  // Basic Information
  shortDescription: string;            // One-line summary
  description: string;                 // Main description
  longDescription?: string;            // Extended description

  // Classification
  primaryMythology: string;            // Main associated mythology
  mythologies: string[];               // Associated mythologies
  tags: string[];                      // Categorical tags

  // Enriched Metadata (NEW)
  powers: string[];                    // Magical abilities
  wielders: string[];                  // Famous users
  origin: string;                      // Creation story
  materials: string[];                 // Composition
  symbolism: string;                   // Spiritual meaning
  currentLocation: string;             // Where it resides

  // ... rest of original fields preserved ...
}
```

## Enriched Metadata Fields

### 1. Powers (Magical Abilities)

**Field**: `powers: string[]`

**Description**: Array of magical abilities or supernatural properties

**Examples**:
```json
{
  "id": "gungnir",
  "powers": [
    "Unerring accuracy",
    "Self-returning",
    "Determination of fate"
  ]
}
```

```json
{
  "id": "mjolnir",
  "powers": [
    "Indestructibility",
    "Self-returning",
    "Weather control"
  ]
}
```

**Data Type**: `string[]`
**Min Length**: 0 (some items have no documented powers)
**Max Length**: Unlimited
**Populated**: 140/184 items (76.1%)

**Extraction Method**:
1. Keyword matching in symbolism text
2. Existing "powers" field preservation
3. Description text analysis

**Usage**:
```javascript
item.powers.forEach(power => {
  console.log(`This item grants: ${power}`);
});
```

---

### 2. Wielders (Famous Users)

**Field**: `wielders: string[]`

**Description**: Array of famous individuals who wielded or owned the item

**Examples**:
```json
{
  "id": "excalibur",
  "wielders": [
    "King Arthur",
    "Merlin (creator)"
  ]
}
```

```json
{
  "id": "gungnir",
  "wielders": [
    "Odin"
  ]
}
```

```json
{
  "id": "aarons-rod",
  "wielders": [
    "Aaron, First High Priest of Israel"
  ]
}
```

**Data Type**: `string[]`
**Min Length**: 0 (some items have unknown wielders)
**Max Length**: Unlimited
**Populated**: 103/184 items (56.0%)

**Extraction Method**:
1. Existing "wielders" field preservation
2. Associated deities extraction
3. Mythology context parsing

**Usage**:
```javascript
if (item.wielders?.length > 0) {
  const wielderList = item.wielders.join(', ');
  console.log(`Notable wielders: ${wielderList}`);
}
```

---

### 3. Origin (Creation Story)

**Field**: `origin: string`

**Description**: Narrative of how the item was created, forged, or came to exist

**Examples**:
```json
{
  "id": "gungnir",
  "origin": "Gungnir's creation is inextricably linked with the creation of Mjolnir and other treasures of the gods, all arising from Loki's mischief... The Sons of Ivaldi, renowned as the greatest craftsmen among the dwarves, agreed to forge replacement hair for Sif... They forged Gungnir, the spear destined for Odin himself..."
}
```

```json
{
  "id": "holy-grail",
  "origin": "The Holy Grail is identified as the cup used by Jesus Christ at the Last Supper in Jerusalem. After the crucifixion, Joseph of Arimathea allegedly used the cup to catch the blood of Jesus..."
}
```

**Data Type**: `string` (plain text or markdown)
**Min Length**: 0 (some items have no documented creation)
**Max Length**: Unlimited
**Populated**: 54/184 items (29.3%)

**Extraction Method**:
1. Search for "Creation Myth" sections
2. Look for "Crafting" or "Forging" sections
3. Extract from "Origin" sections in extended content
4. Parse mythology interpretation sections

**Usage**:
```javascript
if (item.origin?.length > 100) {
  renderSection('How It Was Created', item.origin);
}
```

---

### 4. Materials (Composition)

**Field**: `materials: string[]`

**Description**: Array of materials/substances the item is made of

**Examples**:
```json
{
  "id": "ankh",
  "materials": [
    "Gold",
    "Bronze",
    "Faience",
    "Wood",
    "Stone"
  ]
}
```

```json
{
  "id": "aarons-rod",
  "materials": [
    "Almond wood"
  ]
}
```

```json
{
  "id": "gungnir",
  "materials": [
    "Wood (Yggdrasil branch)",
    "Celestial metal",
    "Rune-inscribed steel"
  ]
}
```

**Data Type**: `string[]`
**Min Length**: 0 (some items have unknown composition)
**Max Length**: Unlimited
**Populated**: 43/184 items (23.4%)

**Extraction Method**:
1. Direct use of existing "materials" field
2. Extract from symbolism text mentioning composition
3. Parse description text for material mentions

**Usage**:
```javascript
if (item.materials?.length > 0) {
  const matList = item.materials.join(', ');
  console.log(`Made of: ${matList}`);
}
```

---

### 5. Symbolism (Spiritual Meaning)

**Field**: `symbolism: string`

**Description**: The spiritual, cultural, or metaphorical meaning of the item

**Examples**:
```json
{
  "id": "ankh",
  "symbolism": "The Ankh is the most recognizable symbol from ancient Egypt, a hieroglyph representing 'life' that became the most powerful of all protective amulets. The ankh represented not only physical life but also spiritual and eternal life, the life of the ka (soul) that continued after death."
}
```

```json
{
  "id": "gungnir",
  "symbolism": "Gungnir primarily symbolizes legitimate authority and the right to rule. Authority and Sovereignty: In Germanic and Norse cultures, the spear was associated with chieftains and kings, who often carried ceremonial spears as symbols of their office. Wisdom Through Sacrifice: The spear that pierced Odin on Yggdrasil represents the principle that true wisdom requires sacrifice and suffering."
}
```

**Data Type**: `string` (rich text with possible markdown)
**Min Length**: 0 (some items lack documented symbolism)
**Max Length**: Unlimited (typically 500-2000 characters)
**Populated**: 66/184 items (35.9%)

**Extraction Method**:
1. Use existing comprehensive "symbolism" field as-is
2. Parse "Symbolism and Meaning" sections
3. Extract from cultural interpretation sections

**Usage**:
```javascript
if (item.symbolism?.length > 0) {
  renderExpandableSection('Spiritual Meaning', item.symbolism);
}
```

---

### 6. Current Location (Resting Place)

**Field**: `currentLocation: string`

**Description**: Where the item currently resides, is kept, or is believed to be located

**Examples**:
```json
{
  "id": "aarons-rod",
  "currentLocation": "According to Hebrews 9:4, Aaron's rod that budded was kept inside the Ark of the Covenant along with the golden pot of manna and the tablets of the covenant. This placement among Israel's most sacred objects shows its supreme importance as testimony to God's choice of the Aaronic priesthood."
}
```

```json
{
  "id": "true-cross",
  "currentLocation": "The Basilica of the Holy Sepulchre in Jerusalem"
}
```

```json
{
  "id": "gungnir",
  "currentLocation": "Carried by Odin in Asgard"
}
```

**Data Type**: `string` (plain text or location description)
**Min Length**: 0 (most items don't specify location)
**Max Length**: Unlimited
**Populated**: 5/184 items (2.7%)

**Extraction Method**:
1. Search for "Location" or "Current Location" sections
2. Look for "Where It Resides" sections
3. Extract from "Kept In" or "Housed In" sections
4. Parse symbolism for "kept in [location]" phrases

**Usage**:
```javascript
if (item.currentLocation?.length > 0) {
  renderSection('Current Location', item.currentLocation);
}
```

---

## Enrichment Tracking

All enriched items include metadata about the enrichment process:

```json
{
  "id": "gungnir",
  "_metadata_enriched": {
    "timestamp": "2026-01-01T13:40:00Z",
    "version": "1.0",
    "fields": {
      "powers": true,
      "wielders": true,
      "origin": true,
      "materials": true,
      "symbolism": true,
      "currentLocation": false
    }
  }
}
```

**Fields**:
- `timestamp`: ISO 8601 datetime of enrichment
- `version`: Enrichment script version used
- `fields`: Boolean flags for each enriched field indicating if populated

## Complete Example: Enriched Item

```json
{
  "id": "gungnir",
  "name": "Gungnir",
  "type": "item",
  "itemType": "weapon",
  "slug": "gungnir",
  "shortDescription": "Odin's legendary spear that never misses its target and always returns to his hand after being thrown",
  "description": "Gungnir, whose name means 'the swaying one' or 'the penetrating one' in Old Norse, is the legendary spear wielded by Odin, the All-Father and chief of the Norse gods...",
  "primaryMythology": "norse",
  "mythologies": ["norse"],
  "tags": ["weapon", "spear", "odin", "dwarven-craft", "never-miss"],

  // ENRICHED FIELDS
  "powers": [
    "Unerring accuracy",
    "Self-returning",
    "Determination of fate"
  ],
  "wielders": [
    "Odin"
  ],
  "origin": "Gungnir's creation is inextricably linked with the creation of Mjolnir and other treasures of the gods... The Sons of Ivaldi, renowned as the greatest craftsmen among the dwarves, forged Gungnir, the spear destined for Odin himself.",
  "materials": [
    "Wood (Yggdrasil branch)",
    "Celestial metal"
  ],
  "symbolism": "Gungnir primarily symbolizes legitimate authority and the right to rule. In Germanic and Norse cultures, the spear was associated with chieftains and kings, who often carried ceremonial spears as symbols of their office...",
  "currentLocation": "",

  // ENRICHMENT TRACKING
  "_metadata_enriched": {
    "timestamp": "2026-01-01T13:40:00Z",
    "version": "1.0",
    "fields": {
      "powers": true,
      "wielders": true,
      "origin": true,
      "materials": true,
      "symbolism": true,
      "currentLocation": false
    }
  },

  // Original fields preserved...
  "extendedContent": [...],
  "sources": [...],
  "visibility": "public",
  "_uploadedAt": "2025-12-25T15:46:34.326873",
  "_modified": "2026-01-01T13:40:00.000Z"
}
```

## Database Indexes Recommended

For optimal Firebase Firestore performance with enriched items:

```javascript
// Composite indexes for common queries
db.collection('items').where('mythology', '==', 'norse').where('powers', 'array-contains', 'Self-returning')

db.collection('items').where('wielders', 'array-contains', 'Odin').where('symbolism', '!=', '')

db.collection('items').where('primaryMythology', '==', 'greek').orderBy('name')
```

## Backward Compatibility

All enrichment is **additive** - no existing fields are modified:
- Original item structure completely preserved
- New fields added without touching existing data
- Merge mode used in Firebase to prevent overwrites
- Safe to re-run enrichment multiple times

## Data Quality Notes

### High Confidence Fields
- **Powers**: 76.1% populated, extracted from clear mythology descriptions
- **Wielders**: 56.0% populated, derived from documented mythological sources

### Medium Confidence Fields
- **Symbolism**: 35.9% populated, from primary source material
- **Materials**: 23.4% populated, archaeological and textual sources

### Low Confidence Fields
- **Origin**: 29.3% populated, requires detailed creation narratives
- **Current Location**: 2.7% populated, most items are mythological/inaccessible

## Integration Checklist

- [ ] Review data model
- [ ] Understand enriched fields
- [ ] Plan frontend display
- [ ] Implement field display components
- [ ] Test with sample items
- [ ] Upload to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor data quality
- [ ] Plan manual enrichment for missing fields

## Related Documentation

- `ITEMS_ENRICHMENT_GUIDE.md` - Usage and procedures
- `ENRICHMENT_RESULTS.md` - Enrichment statistics and results
- `ITEMS_METADATA_SUMMARY.txt` - Complete project summary
- `scripts/enrich-items-metadata.js` - Implementation details
- `scripts/upload-items-enriched.js` - Firebase upload implementation

---

**Last Updated**: January 1, 2026
**Schema Version**: 1.0
**Status**: Ready for production deployment
