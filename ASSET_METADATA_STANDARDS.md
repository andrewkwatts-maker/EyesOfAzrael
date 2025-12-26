# Asset Metadata Standards - Universal Schema

**Version:** 2.0
**Date:** December 25, 2025
**Purpose:** Standardized metadata for all asset types to enable consistent display, search, sort, filter, and visualization

---

## Core Required Metadata (ALL Assets)

Every asset MUST have these fields:

```javascript
{
  // Identity
  "id": "greek_zeus",                    // Unique identifier
  "name": "Zeus",                        // Display name
  "entityType": "deity",                 // Asset type
  "mythology": "greek",                  // Mythology/tradition

  // Content
  "description": "King of the gods...",  // Main description (100-500 chars)
  "longDescription": "...",              // Extended description (optional, 500+ chars)

  // Display
  "icon": "⚡",                          // Unicode emoji or SVG path
  "color": "#9370DB",                    // Theme color (hex)
  "subtitle": "God of Thunder",          // Short title/role

  // Search & Filter
  "searchTerms": [                       // Searchable keywords
    "zeus", "jupiter", "thunder", "sky",
    "king of gods", "olympian"
  ],
  "tags": [                              // Category tags
    "olympian", "sky-god", "major-deity"
  ],

  // Sort
  "sortName": "zeus",                    // Lowercase, no special chars
  "importance": 100,                     // 0-100, higher = more important
  "popularity": 95,                      // 0-100, based on views/references

  // Relationships
  "relatedIds": [                        // Related entity IDs
    "greek_hera", "greek_poseidon", "greek_hades"
  ],

  // Metadata
  "_created": "2025-12-25T10:00:00Z",   // ISO timestamp
  "_modified": "2025-12-25T15:00:00Z",  // ISO timestamp
  "_enhanced": true,                     // Enhanced by agents
  "_version": "2.0"                      // Schema version
}
```

---

## Display-Specific Metadata

### Grid Display
```javascript
{
  "gridDisplay": {
    "title": "Zeus",                     // Grid card title
    "subtitle": "God of Thunder",        // Grid card subtitle
    "image": "/icons/zeus.svg",          // Card image/icon
    "badge": "Olympian",                 // Top-right badge
    "stats": [                           // Quick stats
      { "label": "Domain", "value": "Sky" },
      { "label": "Symbol", "value": "⚡" }
    ],
    "hoverInfo": {                       // Shown on hover
      "quick": "King of Olympian gods",
      "domains": ["Thunder", "Sky", "Justice"]
    }
  }
}
```

### Table Display
```javascript
{
  "tableDisplay": {
    "columns": {                         // Which fields show in table
      "name": { "label": "Name", "sortable": true },
      "mythology": { "label": "Mythology", "sortable": true },
      "domains": { "label": "Domains", "sortable": false },
      "importance": { "label": "Rank", "sortable": true }
    },
    "defaultSort": "importance",         // Default sort column
    "defaultOrder": "desc"               // asc or desc
  }
}
```

### List Display
```javascript
{
  "listDisplay": {
    "icon": "⚡",                        // List item icon
    "primary": "Zeus - God of Thunder",  // Main text
    "secondary": "King of Olympians",    // Sub text
    "meta": "Greek Mythology",           // Metadata text
    "expandable": true,                  // Can expand for more
    "expandedContent": "Full description..." // Shown when expanded
  }
}
```

### Panel Display (Detailed Card)
```javascript
{
  "panelDisplay": {
    "layout": "hero",                    // hero, standard, compact
    "sections": [                        // Ordered sections
      {
        "type": "attributes",
        "title": "Attributes",
        "data": { "domain": ["Sky", "Thunder"], "symbol": ["Lightning Bolt"] }
      },
      {
        "type": "text",
        "title": "Mythology",
        "content": "Long description..."
      },
      {
        "type": "list",
        "title": "Family",
        "items": ["Father: Cronus", "Mother: Rhea"]
      }
    ]
  }
}
```

---

## Corpus Search Metadata

### Language Metadata
```javascript
{
  "languages": {
    "primary": "greek",                  // Primary language
    "originalName": "Ζεύς",             // Original script
    "transliteration": "Zeus",           // Romanized
    "ipa": "/zju:s/",                   // Pronunciation
    "alternateNames": {                  // Other languages
      "latin": "Jupiter",
      "sanskrit": "Dyaus Pita",
      "proto-indo-european": "*Dyḗus"
    }
  }
}
```

### Source Metadata
```javascript
{
  "sources": {
    "primaryTexts": [                    // Ancient sources
      {
        "title": "Iliad",
        "author": "Homer",
        "date": "-800",                  // BCE = negative
        "citations": ["Book 1.498-502", "Book 8.1-27"],
        "language": "ancient-greek"
      },
      {
        "title": "Theogony",
        "author": "Hesiod",
        "date": "-700",
        "citations": ["Lines 453-506"],
        "language": "ancient-greek"
      }
    ],
    "secondarySources": [                // Modern scholarship
      {
        "title": "The Greek Myths",
        "author": "Robert Graves",
        "year": 1955,
        "pages": ["26-31"],
        "isbn": "978-0140171990"
      }
    ],
    "archeologicalEvidence": [           // Physical artifacts
      {
        "type": "temple",
        "name": "Temple of Zeus at Olympia",
        "location": "Olympia, Greece",
        "date": "-456",
        "excavatedBy": "German Archaeological Institute",
        "year": 1875
      }
    ]
  }
}
```

### Corpus Search Terms
```javascript
{
  "corpusSearch": {
    "canonical": "zeus",                 // Primary search term
    "variants": [                        // Spelling variants
      "zeus", "zevs", "zeús", "ζεύς"
    ],
    "epithets": [                        // Titles/names
      "father of gods and men",
      "cloud-gatherer",
      "aegis-bearing",
      "olympian",
      "kronion"
    ],
    "domains": [                         // Functional domains
      "sky", "thunder", "lightning",
      "justice", "law", "kingship"
    ],
    "symbols": [                         // Associated symbols
      "thunderbolt", "eagle", "oak",
      "aegis", "scepter"
    ],
    "places": [                          // Associated locations
      "olympus", "olympia", "dodona"
    ],
    "concepts": [                        // Abstract associations
      "sovereignty", "divine justice",
      "cosmic order", "patriarchy"
    ]
  }
}
```

---

## Visualization Metadata

### Timeline Data
```javascript
{
  "timeline": {
    "era": "classical",                  // Prehistoric, archaic, classical, etc.
    "dateRange": {
      "start": -800,                     // Earliest attestation (BCE = negative)
      "end": 400,                        // Latest significance (CE = positive)
      "peak": -500                       // Period of greatest importance
    },
    "events": [                          // Key historical moments
      {
        "date": -776,
        "event": "First Olympic Games dedicated to Zeus"
      },
      {
        "date": -456,
        "event": "Temple of Zeus at Olympia completed"
      }
    ]
  }
}
```

### Relationship Graph Data
```javascript
{
  "relationships": {
    "family": {
      "parents": ["greek_cronus", "greek_rhea"],
      "siblings": ["greek_hera", "greek_poseidon", "greek_hades"],
      "consorts": ["greek_hera", "greek_leto", "greek_maia"],
      "children": ["greek_apollo", "greek_artemis", "greek_athena"]
    },
    "allies": ["greek_themis", "greek_nike"],
    "enemies": ["greek_typhon", "titans_all"],
    "creations": ["human_pandora"],
    "worshippedBy": ["location_olympia", "location_dodona"],
    "parallels": {                       // Cross-cultural equivalents
      "roman": "roman_jupiter",
      "norse": "norse_odin",
      "egyptian": "egyptian_amun",
      "hindu": "hindu_indra"
    }
  }
}
```

### Hierarchy Data
```javascript
{
  "hierarchy": {
    "level": 1,                          // 1=supreme, 2=major, 3=minor, etc.
    "rank": "king",                      // Role in pantheon
    "generation": "olympian",            // Primordial, Titan, Olympian, etc.
    "subordinates": [                    // Lower-ranking entities
      "greek_athena", "greek_apollo", "greek_hermes"
    ],
    "superiors": [],                     // Higher-ranking (none for Zeus)
    "peers": ["greek_poseidon", "greek_hades"] // Same rank
  }
}
```

### Geographic Data
```javascript
{
  "geography": {
    "primaryCulture": "ancient-greece",
    "regions": [                         // Where worshipped
      {
        "name": "Olympia",
        "location": { "lat": 37.6379, "lon": 21.6300 },
        "type": "temple",
        "importance": "primary"
      },
      {
        "name": "Dodona",
        "location": { "lat": 39.5461, "lon": 20.7869 },
        "type": "oracle",
        "importance": "secondary"
      }
    ],
    "culturalSpread": [                  // How far influence spread
      "greece", "rome", "anatolia", "north-africa"
    ]
  }
}
```

---

## Entity-Type Specific Metadata

### Deities
```javascript
{
  "deity": {
    "domains": ["sky", "thunder", "justice"],
    "symbols": ["thunderbolt", "eagle", "oak"],
    "sacredAnimals": ["eagle"],
    "sacredPlants": ["oak"],
    "epithets": ["Cloud-Gatherer", "Father of Gods"],
    "worshipPractices": ["sacrifice", "prayer", "festivals"],
    "festivals": [
      {
        "name": "Olympic Games",
        "frequency": "every 4 years",
        "description": "Athletic festival in Zeus's honor"
      }
    ]
  }
}
```

### Heroes
```javascript
{
  "hero": {
    "deeds": ["12 Labors", "Sacked Troy"],
    "weapons": ["club", "bow"],
    "companions": ["Iolaus", "Theseus"],
    "quests": [
      {
        "name": "Nemean Lion",
        "difficulty": "extreme",
        "outcome": "success"
      }
    ],
    "divineParentage": "greek_zeus",
    "mortalParentage": "alcmene"
  }
}
```

### Cosmology
```javascript
{
  "cosmology": {
    "cosmologyType": "creation-myth",    // creation-myth, afterlife, realm
    "worldview": "polytheistic",
    "structure": {
      "realms": ["olympus", "earth", "tartarus"],
      "layers": 3
    },
    "cycles": {
      "hasCycle": false,
      "duration": null
    }
  }
}
```

### Creatures
```javascript
{
  "creature": {
    "species": "dragon",
    "alignment": "chaotic-evil",
    "abilities": ["flight", "fire-breath", "regeneration"],
    "weaknesses": ["decapitation", "fire"],
    "habitat": "swamp",
    "intelligence": "animal"
  }
}
```

### Texts
```javascript
{
  "text": {
    "author": "Homer",
    "date": "-800",
    "language": "ancient-greek",
    "genre": "epic-poetry",
    "verses": 15693,
    "books": 24,
    "keyThemes": ["wrath", "honor", "fate"],
    "famousQuotes": [
      {
        "text": "Sing, O goddess, the anger of Achilles",
        "citation": "Book 1, Line 1"
      }
    ]
  }
}
```

### Rituals
```javascript
{
  "ritual": {
    "purpose": ["honor-deity", "seek-favor"],
    "frequency": "annual",
    "participants": ["priests", "citizens"],
    "tools": ["altar", "incense", "offerings"],
    "steps": [
      "Procession to temple",
      "Purification rites",
      "Animal sacrifice",
      "Prayer and hymns"
    ],
    "timing": {
      "season": "summer",
      "month": "july",
      "phase": "full-moon"
    }
  }
}
```

### Herbs
```javascript
{
  "herb": {
    "botanicalName": "Quercus robur",
    "family": "Fagaceae",
    "parts": ["leaves", "bark", "acorns"],
    "medicinal": {
      "uses": ["astringent", "anti-inflammatory"],
      "preparations": ["decoction", "tincture"]
    },
    "ritual": {
      "uses": ["divination", "protection"],
      "deity": "greek_zeus"
    },
    "growing": {
      "zones": "4-8",
      "soil": "well-drained",
      "light": "full-sun"
    }
  }
}
```

---

## Hover/Expandable Content Standards

### Hoverable Link Lists
```javascript
{
  "hoverableLinks": {
    "domains": [
      {
        "term": "Thunder",
        "tooltip": "Control of storms and lightning",
        "corpusLink": "/search?term=thunder&context=greek",
        "relatedEntities": ["greek_thor", "hindu_indra"]
      }
    ],
    "symbols": [
      {
        "term": "Thunderbolt",
        "tooltip": "Forged by Cyclopes, symbol of divine power",
        "image": "/symbols/thunderbolt.svg",
        "corpusLink": "/search?term=thunderbolt"
      }
    ]
  }
}
```

### Expandable Sections
```javascript
{
  "expandable": {
    "mythology": {
      "collapsed": "Zeus overthrew his father Cronus...",  // First 100 chars
      "expanded": "Full multi-paragraph story...",         // Complete content
      "hasMore": true
    },
    "worship": {
      "collapsed": "Worshipped at Olympia and Dodona...",
      "expanded": "Detailed worship practices...",
      "hasMore": true
    }
  }
}
```

---

## Filter/Sort Configuration

### Filter Options
```javascript
{
  "filters": {
    "mythology": {
      "type": "select-multiple",
      "options": ["greek", "roman", "norse", "egyptian"],
      "default": []
    },
    "entityType": {
      "type": "select-multiple",
      "options": ["deity", "hero", "creature"],
      "default": []
    },
    "domains": {
      "type": "select-multiple",
      "options": ["sky", "thunder", "war", "love"],
      "default": []
    },
    "importance": {
      "type": "range",
      "min": 0,
      "max": 100,
      "default": [0, 100]
    },
    "hasImage": {
      "type": "boolean",
      "default": null
    }
  }
}
```

### Sort Options
```javascript
{
  "sortOptions": [
    {
      "field": "sortName",
      "label": "Name (A-Z)",
      "order": "asc",
      "type": "alphabetical"
    },
    {
      "field": "importance",
      "label": "Importance",
      "order": "desc",
      "type": "numerical"
    },
    {
      "field": "popularity",
      "label": "Popularity",
      "order": "desc",
      "type": "numerical"
    },
    {
      "field": "_modified",
      "label": "Recently Updated",
      "order": "desc",
      "type": "timestamp"
    }
  ]
}
```

---

## Implementation Checklist

For each asset type, ensure:

- [ ] All core required fields present
- [ ] Display metadata for grid/table/list/panel
- [ ] Language metadata with original script
- [ ] Source metadata with citations
- [ ] Corpus search terms comprehensive
- [ ] Visualization data (timeline, relationships, hierarchy)
- [ ] Entity-specific metadata complete
- [ ] Hoverable/expandable content structured
- [ ] Filter/sort configuration defined

---

## Validation Script

```javascript
function validateAssetMetadata(asset) {
  const required = ['id', 'name', 'entityType', 'mythology', 'description'];
  const missing = required.filter(field => !asset[field]);

  if (missing.length > 0) {
    console.error(`Missing required fields: ${missing.join(', ')}`);
    return false;
  }

  // Validate searchTerms
  if (!asset.searchTerms || asset.searchTerms.length === 0) {
    console.warn(`Missing searchTerms for ${asset.id}`);
  }

  // Validate display metadata
  if (!asset.gridDisplay && !asset.tableDisplay && !asset.listDisplay) {
    console.warn(`No display metadata for ${asset.id}`);
  }

  return true;
}
```

---

**This standard enables:**
- ✅ Consistent display across all components
- ✅ Powerful search and filtering
- ✅ Multi-dimensional sorting
- ✅ Rich visualizations
- ✅ Cross-cultural comparisons
- ✅ Academic citations
- ✅ Responsive hover interactions
- ✅ Expandable content
- ✅ Corpus search integration
