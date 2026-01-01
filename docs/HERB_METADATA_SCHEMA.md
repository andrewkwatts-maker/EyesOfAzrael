# Sacred Herb Entity Metadata Schema

## Overview

This document defines the standard metadata structure for herb entities in the Eyes of Azrael mythology encyclopedia. All herb records should conform to this schema to ensure consistency, discoverability, and richness of information.

## Base Fields

Every herb entity includes these base fields:

```typescript
{
  // Identification
  id: string                    // Unique identifier (e.g., "buddhist_lotus")
  type: "herb"                  // Entity type
  name: string                  // Display name
  primaryMythology: string      // Primary tradition (e.g., "buddhist")
  mythologies: string[]         // All associated traditions

  // Display
  displayName: string           // With emoji (e.g., "🌿 Lotus")
  description: string           // Brief description
  icon: string                  // SVG icon
  iconType: "svg"              // Icon format type

  // Classification
  status: "published"           // Publication status
  visibility: "public"          // Visibility level
  entityType: "herb"           // Explicit entity type

  // Timestamps
  createdAt: ISO8601           // Creation timestamp
  updatedAt: ISO8601           // Last update timestamp
  _modified: ISO8601           // Internal modification timestamp
}
```

## Rich Metadata Structure

### 1. Properties (Magical, Medicinal, Spiritual)

Categorizes the herb's characteristics across different dimensions:

```typescript
properties: {
  magical: string[]      // Magical/mystical properties
  medicinal: string[]    // Health benefits and uses
  spiritual: string[]    // Spiritual significance
}
```

**Examples:**
- **Lotus (Buddhist)**
  - Magical: ['purity', 'spiritual awakening', 'enlightenment', 'rebirth']
  - Medicinal: ['adaptogenic', 'sedative', 'astringent', 'nutritive']
  - Spiritual: ["Buddha's seat", 'dharma symbol', 'chakra awakening']

- **Tulsi (Hindu)**
  - Magical: ['devotion', 'purity', 'divine protection', 'spiritual elevation']
  - Medicinal: ['adaptogen', 'immune support', 'respiratory health', 'stress reduction']
  - Spiritual: ['puja offerings', 'Vishnu worship', 'household shrine']

### 2. Preparations (Methods and Dosage)

Detailed preparation instructions and safe usage guidelines:

```typescript
preparations: {
  primary: string[]           // Main preparation methods with instructions
  alternative: string[]       // Alternative methods
  dosage: string             // Recommended dosage
}
```

**Examples:**
- **Lotus**
  - Primary methods:
    - "Lotus seed tea: simmer dried seeds for calming"
    - "Lotus root: slice and cook for nutrition"
  - Dosage: "6-15g dried seeds, 3-10g dried leaf"

- **Tulsi**
  - Primary methods:
    - "Tulsi tea: 5-7 fresh leaves or 1 tsp dried, simmer 5-10 minutes"
    - "Fresh leaves: chewed directly or added to water"
  - Dosage: "5-7 fresh leaves daily or 1-2 cups tea"

### 3. Associations (Deities, Concepts, Elements, Chakras)

Links the herb to other entities and concepts in the mythology system:

```typescript
associations: {
  deities: string[]          // Associated gods/goddesses (use IDs)
  concepts: string[]         // Linked concepts/ideas
  elements: string[]         // Elemental associations
  chakras: string[]          // Chakra associations
}
```

**Examples:**
- **Lotus**
  - Deities: ['gautama_buddha', 'avalokiteshvara', 'tara', 'manjushri', 'lakshmi']
  - Concepts: ['enlightenment', 'purity', 'compassion', 'wisdom']
  - Elements: ['water', 'earth']
  - Chakras: ['heart', 'crown']

- **Black Seed (Islamic)**
  - Deities: ['allah']
  - Concepts: ['healing', 'blessing', 'mercy', 'divine remedy']
  - Elements: ['earth', 'fire']
  - Chakras: ['solar plexus', 'heart']

### 4. Harvesting (Season, Method, Conditions)

Information about ethical and practical harvesting:

```typescript
harvesting: {
  season: string          // Best harvesting season
  method: string          // How to harvest
  conditions: string      // Optimal growing conditions
}
```

**Examples:**
- **Lotus**
  - Season: "Summer (July-September for flowers and seeds)"
  - Method: "Hand-harvest fully opened flowers and mature seed pods"
  - Conditions: "Shallow ponds, marshes, 6-18 inches water depth, full sun"

- **Sandalwood**
  - Season: "Year-round (mature heartwood preferred)"
  - Method: "Harvest mature heartwood, allow to age and cure"
  - Conditions: "Tropical and subtropical climates"

### 5. Dangers (Toxicity, Warnings, Contraindications)

Critical safety information:

```typescript
dangers: {
  toxicity: string             // Toxicity level (Non-toxic, Low, Moderate, High)
  warnings: string[]           // Safety warnings
  contraindications: string[]  // Medical contraindications
}
```

**Examples:**
- **Lotus**
  - Toxicity: "Non-toxic"
  - Warnings: ['Ensure clean water source if wild-harvesting']
  - Contraindications: ['Generally safe as food and tea']

- **Tulsi**
  - Toxicity: "Generally safe"
  - Warnings: ['Avoid large medicinal doses during pregnancy', 'May have mild blood-thinning effect']
  - Contraindications: ['Pregnancy: culinary amounts safe, medicinal doses limited']

- **Black Seed**
  - Toxicity: "Low (very safe)"
  - Warnings: ['Generally recognized as safe by WHO', 'High doses may cause digestive upset']
  - Contraindications: ['Pregnancy: consult for large medicinal doses']

### 6. Substitutes (Alternative Herbs)

Lists equivalent or related herbs for alternative use:

```typescript
substitutes: Array<{
  name: string          // Herb name
  reason: string        // Why it's a substitute
  tradition: string     // Tradition context
}>
```

**Examples:**
- **Lotus**
  - Water Lily: "Similar aquatic flower, some shared properties" (multiple traditions)
  - Lotus Seed: "Different part, concentrated properties" (buddhist)

- **Tulsi**
  - Basil: "Culinary and some medicinal properties" (western)
  - Mint: "Similar calming and digestive support" (ayurvedic)

- **Laurel**
  - Bay Leaf: "Same plant, common culinary substitute" (universal)
  - Rosemary: "Similar Mediterranean herb properties" (greek)

### 7. Botanical Information

Scientific and taxonomic data:

```typescript
botanicalInfo: {
  scientificName: string       // Latin binomial name
  family: string              // Plant family
  nativeRegion: string        // Geographic origin
  commonNames: string[]       // Alternative names
}
```

**Examples:**
- **Lotus**
  - Scientific Name: "Nelumbo nucifera"
  - Family: "Nelumbonaceae"
  - Native Region: "Asia (India to Japan, Australia)"
  - Common Names: ['Sacred Lotus', 'Indian Lotus', 'Padma', 'Kamala']

- **Tulsi**
  - Scientific Name: "Ocimum sanctum (Ocimum tenuiflorum)"
  - Family: "Lamiaceae"
  - Native Region: "Indian subcontinent"
  - Common Names: ['Holy Basil', 'Sacred Basil', 'Vrinda', 'Lakshmi Plant']

## Complete Example

Here's a complete herb record with all metadata:

```json
{
  "id": "buddhist_lotus",
  "type": "herb",
  "name": "Lotus",
  "displayName": "🌿 Lotus",
  "primaryMythology": "buddhist",
  "mythologies": ["buddhist", "hindu", "egyptian"],

  "properties": {
    "magical": ["purity", "spiritual awakening", "enlightenment", "rebirth", "divine beauty"],
    "medicinal": ["adaptogenic", "sedative", "astringent", "nutritive", "aphrodisiac"],
    "spiritual": ["Buddha's seat", "dharma symbol", "emergence from suffering", "unstained purity", "chakra awakening"]
  },

  "preparations": {
    "primary": [
      "Lotus seed tea: simmer dried seeds for calming nervousness",
      "Lotus root: slice and cook for nutrition and lung health",
      "Lotus petal tea: steep dried petals for aromatic calming tea",
      "Stamens: dry and use in tea blends for heart health",
      "Seed paste: grind seeds for mooncake filling (spiritual festivals)"
    ],
    "alternative": [
      "Fresh lotus flowers as offerings",
      "Lotus leaf wraps for steaming food",
      "Lotus root juice for nosebleeds"
    ],
    "dosage": "6-15g dried seeds, 3-10g dried leaf"
  },

  "associations": {
    "deities": ["gautama_buddha", "avalokiteshvara", "tara", "manjushri", "lakshmi"],
    "concepts": ["enlightenment", "purity", "compassion", "wisdom", "rebirth"],
    "elements": ["water", "earth"],
    "chakras": ["heart", "crown"]
  },

  "harvesting": {
    "season": "Summer (July-September for flowers and seeds)",
    "method": "Hand-harvest fully opened flowers and mature seed pods",
    "conditions": "Shallow ponds, marshes, 6-18 inches water depth, full sun"
  },

  "dangers": {
    "toxicity": "Non-toxic",
    "warnings": ["Ensure clean water source if wild-harvesting"],
    "contraindications": ["Generally safe as food and tea"]
  },

  "substitutes": [
    {
      "name": "Water Lily",
      "reason": "Similar aquatic flower, some shared properties",
      "tradition": "multiple"
    },
    {
      "name": "Lotus Seed",
      "reason": "Different part, concentrated properties",
      "tradition": "buddhist"
    }
  ],

  "botanicalInfo": {
    "scientificName": "Nelumbo nucifera",
    "family": "Nelumbonaceae",
    "nativeRegion": "Asia (India to Japan, Australia)",
    "commonNames": ["Sacred Lotus", "Indian Lotus", "Padma", "Kamala"]
  },

  "status": "published",
  "visibility": "public",
  "description": "The lotus flower symbolizes purity, enlightenment, and spiritual awakening...",
  "createdAt": "2025-12-25T05:23:54.914Z",
  "updatedAt": "2025-12-26T05:15:08.293Z",

  "metadata": {
    "enrichedWithMetadata": true,
    "enrichmentDate": "2026-01-01T12:00:00.000Z",
    "enrichmentVersion": "2.0"
  }
}
```

## Implementation Guidelines

### For Developers

1. **Validation**: Use this schema to validate herb entities before Firebase updates
2. **Consistency**: Always populate all 7 metadata sections for complete records
3. **Relationships**: Use entity IDs for deity and concept references for cross-linking
4. **Translation**: Provide original names alongside transliteration in `linguisticInfo`

### For Content Contributors

1. **Properties**: Categorize between magical (spiritual), medicinal (health), and spiritual (practice)
2. **Preparations**: Include step-by-step instructions with traditional and modern methods
3. **Harvesting**: Always include ethical guidelines and sustainability notes
4. **Safety**: Be comprehensive with warnings, especially for sacred or potent herbs
5. **Substitutes**: List alternatives with clear reasoning and tradition context

### For Content Review

- [ ] All 7 metadata sections completed
- [ ] No empty arrays in required fields
- [ ] Proper entity ID references for deities
- [ ] Safety warnings clearly stated
- [ ] Botanical information accurate and sourced
- [ ] Preparations tested or historically verified

## Metadata Tracking

All enriched records include metadata tracking:

```typescript
metadata: {
  enrichedWithMetadata: boolean         // Enrichment flag
  enrichmentDate: ISO8601              // When enriched
  enrichmentVersion: string            // Schema version (e.g., "2.0")
  source?: string                      // Original data source
  verified?: boolean                   // Verification status
  createdBy?: string                   // Who created/enriched
}
```

## Related Resources

- **Schema Version**: 2.0
- **Last Updated**: 2026-01-01
- **Firebase Collection**: `herbs`
- **Enrichment Script**: `scripts/enrich-herbs-metadata.js`
- **Validation Tool**: `scripts/validate-herb-metadata.js` (upcoming)

## Future Enhancements

- [ ] Add growing conditions (USDA zones, climate requirements)
- [ ] Include cultivation difficulty levels
- [ ] Add companion planting recommendations
- [ ] Storage and shelf-life guidelines
- [ ] Cross-tradition preparation variations
- [ ] Seasonal availability by region
- [ ] Cost/availability ratings
- [ ] Research citations and sources
