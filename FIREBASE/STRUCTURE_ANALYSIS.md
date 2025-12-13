# Firebase Firestore Structure Analysis

**Generated:** 2025-12-13T03:29:39.778Z

## Executive Summary

- **Total Collections:** 32
- **Total Documents:** 1701
- **Documents Missing Mythology Field:** 448
- **Collections with Schema Inconsistencies:** 1

---

## 1. Complete Collection Inventory

### Collection: `archetypes`

- **Document Count:** 4
- **Mythologies:** None/Not Organized
- **Asset Types:** Not Specified
- **Unique Fields:** totalOccurrences, occurrences, metadata, mythologyCount, name, id
- **Schema Variations:** 1

### Collection: `aztec`

- **Document Count:** 5
- **Mythologies:** aztec
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `babylonian`

- **Document Count:** 8
- **Mythologies:** babylonian
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `buddhist`

- **Document Count:** 8
- **Mythologies:** buddhist
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `celtic`

- **Document Count:** 10
- **Mythologies:** celtic
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `chinese`

- **Document Count:** 8
- **Mythologies:** chinese
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `christian`

- **Document Count:** 8
- **Mythologies:** christian
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `concepts`

- **Document Count:** 15
- **Mythologies:** buddhist, christian, egyptian, greek, japanese, norse, sumerian
- **Asset Types:** concept
- **Unique Fields:** significance, metadata, filename, displayName, name, primarySources, description, relatedConcepts, id, type, mythology, participants
- **Schema Variations:** 1

### Collection: `cosmology`

- **Document Count:** 65
- **Mythologies:** babylonian, buddhist, celtic, chinese, christian, egyptian, greek, hindu, islamic, norse, persian, roman, sumerian, tarot
- **Asset Types:** concept, realm, place
- **Unique Fields:** inhabitants, metadata, displayName, description, type, mythology, features, filename, layers, name, primarySources, id, connections
- **Schema Variations:** 1

### Collection: `creatures`

- **Document Count:** 30
- **Mythologies:** babylonian, buddhist, christian, egyptian, greek, hindu, islamic, norse, persian, sumerian, tarot
- **Asset Types:** dragon, spirit, creature, beast, monster
- **Unique Fields:** metadata, habitats, displayName, description, type, mythology, abilities, relationships, filename, weaknesses, name, primarySources, attributes, id
- **Schema Variations:** 1

### Collection: `cross_references`

- **Document Count:** 421
- **Mythologies:** None/Not Organized
- **Asset Types:** Not Specified
- **Unique Fields:** relatedContent, id
- **Schema Variations:** 1

### Collection: `deities`

- **Document Count:** 190
- **Mythologies:** aztec, babylonian, buddhist, celtic, chinese, christian, egyptian, greek, hindu, islamic, japanese, mayan, norse, persian, roman, sumerian, tarot, yoruba
- **Asset Types:** Not Specified
- **Unique Fields:** id, name, displayName, mythology, title, description, archetypes, domains, symbols, epithets, attributes, relationships, primarySources, relatedEntities, metadata
- **Schema Variations:** 1

### Collection: `egyptian`

- **Document Count:** 25
- **Mythologies:** egyptian
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `greek`

- **Document Count:** 22
- **Mythologies:** greek
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `herbs`

- **Document Count:** 22
- **Mythologies:** buddhist, egyptian, greek, hindu, islamic, norse, persian
- **Asset Types:** Not Specified
- **Unique Fields:** metadata, filename, displayName, name, primarySources, description, uses, id, rituals, properties, mythology, preparation
- **Schema Variations:** 1

### Collection: `heroes`

- **Document Count:** 50
- **Mythologies:** babylonian, buddhist, christian, greek, hindu, islamic, jewish, norse, persian, roman, sumerian
- **Asset Types:** Not Specified
- **Unique Fields:** metadata, quests, displayName, description, titles, feats, mythology, relationships, filename, companions, name, primarySources, attributes, id, weapons
- **Schema Variations:** 1

### Collection: `hindu`

- **Document Count:** 20
- **Mythologies:** hindu
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `islamic`

- **Document Count:** 3
- **Mythologies:** islamic
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `japanese`

- **Document Count:** 6
- **Mythologies:** japanese
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `mayan`

- **Document Count:** 5
- **Mythologies:** mayan
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `mythologies`

- **Document Count:** 22
- **Mythologies:** None/Not Organized
- **Asset Types:** Not Specified
- **Unique Fields:** metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Schema Variations:** 1

### Collection: `norse`

- **Document Count:** 17
- **Mythologies:** norse
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `persian`

- **Document Count:** 8
- **Mythologies:** persian
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `rituals`

- **Document Count:** 20
- **Mythologies:** babylonian, buddhist, christian, egyptian, greek, hindu, islamic, norse, persian, roman, tarot
- **Asset Types:** Not Specified
- **Unique Fields:** metadata, purpose, displayName, timing, description, steps, tools, mythology, filename, name, primarySources, id, participants
- **Schema Variations:** 1

### Collection: `roman`

- **Document Count:** 19
- **Mythologies:** roman
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `search_index`

- **Document Count:** 634
- **Mythologies:** celtic, mayan, persian, islamic, japanese, egyptian, sumerian, greek, roman, buddhist, babylonian, norse, hindu, chinese, christian, aztec, tarot, yoruba, jewish, apocryphal, comparative, freemasons, native_american
- **Asset Types:** deity, mythology
- **Unique Fields:** metadata, displayName, autocompletePrefixes, description, sourceFile, mythology, tags, searchTokens, name, qualityScore, id, contentType, createdAt, type, archetypes, domains, searchTerms
- **Schema Variations:** 3

### Collection: `sumerian`

- **Document Count:** 7
- **Mythologies:** sumerian
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `symbols`

- **Document Count:** 2
- **Mythologies:** persian
- **Asset Types:** Not Specified
- **Unique Fields:** relationships, metadata, filename, displayName, name, primarySources, description, attributes, id, contentType, mythology
- **Schema Variations:** 1

### Collection: `tarot`

- **Document Count:** 6
- **Mythologies:** tarot
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

### Collection: `texts`

- **Document Count:** 35
- **Mythologies:** christian, egyptian, jewish
- **Asset Types:** Not Specified
- **Unique Fields:** relationships, metadata, filename, displayName, name, primarySources, description, attributes, id, contentType, mythology
- **Schema Variations:** 1

### Collection: `users`

- **Document Count:** 1
- **Mythologies:** None/Not Organized
- **Asset Types:** Not Specified
- **Unique Fields:** avatar, email, username, createdAt, photoURL, displayName, updatedAt
- **Schema Variations:** 1

### Collection: `yoruba`

- **Document Count:** 5
- **Mythologies:** yoruba
- **Asset Types:** Not Specified
- **Unique Fields:** epithets, displayName, description, domains, title, symbols, mythology, relationships, archetypes, rawMetadata, name, primarySources, attributes, id, relatedEntities
- **Schema Variations:** 1

---

## 2. Schema Analysis by Collection

### `archetypes` Schema

#### Schema Variation 1

**Fields:**
- `id` (string)
- `metadata` (object)
- `mythologyCount` (number)
- `name` (string)
- `occurrences` (object)
- `totalOccurrences` (number)

**Sample Documents:**

<details>
<summary>Document 1: archetypes</summary>

```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Archetypes",
  "id": "archetypes"
}
```

</details>

<details>
<summary>Document 2: hermetic</summary>

```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "magician",
        "name": "As Above, So Below"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Hermetic",
  "id": "hermetic"
}
```

</details>

<details>
<summary>Document 3: related-mythological-figures</summary>

```json
{
  "totalOccurrences": 6,
  "occurrences": {
    "tarot": [
      {
        "deity": "empress",
        "name": "The Great Mother"
      },
      {
        "deity": "fool",
        "name": "The Innocent Seeker"
      },
      {
        "deity": "high-priestess",
        "name": "Guardian of Hidden Knowledge"
      },
      {
        "deity": "lovers",
        "name": "Sacred Union"
      },
      {
        "deity": "magician",
        "name": "As Above, So Below"
      },
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "Related Mythological Figures",
  "id": "related-mythological-figures"
}
```

</details>

<details>
<summary>Document 4: world</summary>

```json
{
  "totalOccurrences": 1,
  "occurrences": {
    "tarot": [
      {
        "deity": "world",
        "name": "Cosmic Completion"
      }
    ]
  },
  "metadata": {
    "createdAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "updatedAt": {
      "_seconds": 1765593883,
      "_nanoseconds": 359000000
    }
  },
  "mythologyCount": 1,
  "name": "world",
  "id": "world"
}
```

</details>

---

### `aztec` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: coatlicue</summary>

```json
{
  "epithets": [
    "Coatlicue",
    "Teteoinan (\"Mother of Gods\")",
    "Toci (\"Our Grandmother\")"
  ],
  "displayName": "👾 Coatlicue",
  "description": "Coatlicue - \"Serpent Skirt\" / \"She of the Serpent Skirt\"",
  "domains": [
    "Earth",
    "fertility",
    "creation",
    "death",
    "the grave",
    "serpents",
    "childbirth",
    "the stars (as their mother)",
    "Primordial mother goddess",
    "mother of Huitzilopochtli",
    "Coyolxauhqui",
    "and the 400 southern stars"
  ],
  "title": "Aztec - Coatlicue",
  "symbols": [
    "Serpents",
    "skulls",
    "human hearts and hands",
    "clawed feet",
    "dual serpent heads",
    "the earth itself",
    "Serpents (especially rattlesnakes)",
    "eagles",
    "jaguars",
    "Her most defining feature - a skirt made of intertwined serpents",
    "representing the earth's fertility and dangerous power"
  ],
  "mythology": "aztec",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Coatlicue",
      "Teteoinan (\"Mother of Gods\")",
      "Toci (\"Our Grandmother\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Earth",
      "fertility",
      "creation",
      "death",
      "the grave",
      "serpents",
      "childbirth",
      "the stars (as their mother)",
      "Primordial mother goddess",
      "mother of Huitzilopochtli",
      "Coyolxauhqui",
      "and the 400 southern stars"
    ],
    "attributes": [],
    "symbols": [
      "Serpents",
      "skulls",
      "human hearts and hands",
      "clawed feet",
      "dual serpent heads",
      "the earth itself",
      "Serpents (especially rattlesnakes)",
      "eagles",
      "jaguars",
      "Her most defining feature - a skirt made of intertwined serpents",
      "representing the earth's fertility and dangerous power"
    ]
  },
  "name": "Coatlicue",
  "primarySources": [],
  "attributes": [],
  "id": "coatlicue",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Gaia\n                        Greek",
      "link": "../../greek/deities/gaia.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Kali\n                        Hindu",
      "link": "../../hindu/deities/kali.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Hel\n                        Norse",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Isis\n                        Egyptian",
      "link": "../../egyptian/deities/isis.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: huitzilopochtli</summary>

```json
{
  "epithets": [
    "Huitzilopochtli",
    "Aztec warriors believed fallen soldiers returned as hummingbirds to follow the sun",
    "Totec (\"Our Lord\")",
    "Blue Tezcatlipoca",
    "Portent of War"
  ],
  "displayName": "☀ Huitzilopochtli",
  "description": "Huitzilopochtli - \"Hummingbird of the South\" / \"Left-Handed Hummingbird\"",
  "domains": [
    "War",
    "sun",
    "human sacrifice",
    "Mexica nation",
    "warriors",
    "the south"
  ],
  "title": "Aztec - Huitzilopochtli",
  "symbols": [
    "Xiuhcoatl (fire serpent)",
    "hummingbird feathers",
    "eagle",
    "sun disk",
    "human hearts",
    "Hummingbird",
    "eagle (symbol of the sun and warriors)",
    "Warrior with hummingbird helmet and feather headdress",
    "blue-painted body",
    "holding shield and fire serpent"
  ],
  "mythology": "aztec",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Huitzilopochtli",
      "Aztec warriors believed fallen soldiers returned as hummingbirds to follow the sun",
      "Totec (\"Our Lord\")",
      "Blue Tezcatlipoca",
      "Portent of War"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "War",
      "sun",
      "human sacrifice",
      "Mexica nation",
      "warriors",
      "the south"
    ],
    "attributes": [],
    "symbols": [
      "Xiuhcoatl (fire serpent)",
      "hummingbird feathers",
      "eagle",
      "sun disk",
      "human hearts",
      "Hummingbird",
      "eagle (symbol of the sun and warriors)",
      "Warrior with hummingbird helmet and feather headdress",
      "blue-painted body",
      "holding shield and fire serpent"
    ]
  },
  "name": "Huitzilopochtli",
  "primarySources": [],
  "attributes": [],
  "id": "huitzilopochtli",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Ares\n                        Greek",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "🇹\n                        Mars\n                        Roman",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Ra\n                        Egyptian",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Thor\n                        Norse",
      "link": "../../norse/deities/thor.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: quetzalcoatl</summary>

```json
{
  "epithets": [
    "Quetzalcoatl",
    "Ehecatl (Wind aspect)",
    "Ce Acatl Topiltzin (historical priest-king)"
  ],
  "displayName": "🐍 Quetzalcoatl",
  "description": "Quetzalcoatl - \"Feathered Serpent\" / \"Precious Twin\"",
  "domains": [
    "Wind",
    "air",
    "learning",
    "knowledge",
    "arts",
    "dawn",
    "the morning star (Venus)",
    "priesthood",
    "merchants"
  ],
  "title": "Aztec - Quetzalcoatl",
  "symbols": [
    "Feathered serpent",
    "wind jewel (ehecailacocozcatl)",
    "conch shell",
    "Venus",
    "quetzal feathers",
    "Quetzal bird",
    "rattlesnake",
    "spider monkey",
    "dog (Xolotl)",
    "Depicted as a serpent covered in quetzal feathers",
    "or as a man with a beard wearing a conical hat and wind jewel",
    "As the morning star",
    "he was associated with death and resurrection",
    "disappearing and reappearing"
  ],
  "mythology": "aztec",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Quetzalcoatl",
      "Ehecatl (Wind aspect)",
      "Ce Acatl Topiltzin (historical priest-king)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Wind",
      "air",
      "learning",
      "knowledge",
      "arts",
      "dawn",
      "the morning star (Venus)",
      "priesthood",
      "merchants"
    ],
    "attributes": [],
    "symbols": [
      "Feathered serpent",
      "wind jewel (ehecailacocozcatl)",
      "conch shell",
      "Venus",
      "quetzal feathers",
      "Quetzal bird",
      "rattlesnake",
      "spider monkey",
      "dog (Xolotl)",
      "Depicted as a serpent covered in quetzal feathers",
      "or as a man with a beard wearing a conical hat and wind jewel",
      "As the morning star",
      "he was associated with death and resurrection",
      "disappearing and reappearing"
    ]
  },
  "name": "Quetzalcoatl",
  "primarySources": [],
  "attributes": [],
  "id": "quetzalcoatl",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Prometheus\n                        Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Thoth\n                        Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Odin\n                        Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Vishnu\n                        Hindu",
      "link": "../../hindu/deities/vishnu.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: tezcatlipoca</summary>

```json
{
  "epithets": [
    "Tezcatlipoca",
    "Titlacauan (\"We are his Slaves\")",
    "Ipalnemoani (\"He by whom we live\")",
    "Yohualli Ehecatl (\"Night Wind\")",
    "Moyocoyani (\"Capricious One\")"
  ],
  "displayName": "🪙 Tezcatlipoca",
  "description": "Tezcatlipoca - \"Smoking Mirror\"",
  "domains": [
    "Night",
    "darkness",
    "sorcery",
    "divination",
    "fate",
    "beauty",
    "war",
    "discord",
    "jaguars",
    "obsidian",
    "rulership"
  ],
  "title": "Aztec - Tezcatlipoca",
  "symbols": [
    "Obsidian mirror",
    "jaguar",
    "obsidian knife",
    "eagle",
    "turkey",
    "severed foot",
    "yellow and black stripes",
    "Jaguar (his nahual/spirit form)",
    "coyote",
    "owl",
    "An obsidian mirror replacing his foot or worn on his chest",
    "from which smoke emanates - showing visions of the past",
    "present",
    "and future"
  ],
  "mythology": "aztec",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Tezcatlipoca",
      "Titlacauan (\"We are his Slaves\")",
      "Ipalnemoani (\"He by whom we live\")",
      "Yohualli Ehecatl (\"Night Wind\")",
      "Moyocoyani (\"Capricious One\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Night",
      "darkness",
      "sorcery",
      "divination",
      "fate",
      "beauty",
      "war",
      "discord",
      "jaguars",
      "obsidian",
      "rulership"
    ],
    "attributes": [],
    "symbols": [
      "Obsidian mirror",
      "jaguar",
      "obsidian knife",
      "eagle",
      "turkey",
      "severed foot",
      "yellow and black stripes",
      "Jaguar (his nahual/spirit form)",
      "coyote",
      "owl",
      "An obsidian mirror replacing his foot or worn on his chest",
      "from which smoke emanates - showing visions of the past",
      "present",
      "and future"
    ]
  },
  "name": "Tezcatlipoca",
  "primarySources": [],
  "attributes": [],
  "id": "tezcatlipoca",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🛡\n                        Loki\n                        Norse",
      "link": "../../norse/deities/loki.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Set\n                        Egyptian",
      "link": "../../egyptian/deities/set.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Hades\n                        Greek",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Shiva\n                        Hindu",
      "link": "../../hindu/deities/shiva.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: tlaloc</summary>

```json
{
  "epithets": [
    "Tlaloc",
    "Tlamacazqui (\"The Provider\")",
    "Lord of the Third Heaven"
  ],
  "displayName": "🌧 Tlaloc",
  "description": "Tlaloc - \"He Who Makes Things Sprout\" / \"Earth\"",
  "domains": [
    "Rain",
    "water",
    "fertility",
    "agriculture",
    "lightning",
    "thunder",
    "mountains (where clouds gather)"
  ],
  "title": "Aztec - Tlaloc",
  "symbols": [
    "Goggle eyes",
    "fanged mouth",
    "jade",
    "maize",
    "water jugs",
    "lightning bolts",
    "herons",
    "frogs",
    "Frogs (heralds of rain)",
    "jaguars",
    "serpents",
    "snails",
    "Mount Tlaloc",
    "where his main shrine stood 4",
    "120 meters high",
    "His most distinctive feature - circular rings around the eyes",
    "possibly representing rain clouds",
    "water",
    "or serpent coils"
  ],
  "mythology": "aztec",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Tlaloc",
      "Tlamacazqui (\"The Provider\")",
      "Lord of the Third Heaven"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Rain",
      "water",
      "fertility",
      "agriculture",
      "lightning",
      "thunder",
      "mountains (where clouds gather)"
    ],
    "attributes": [],
    "symbols": [
      "Goggle eyes",
      "fanged mouth",
      "jade",
      "maize",
      "water jugs",
      "lightning bolts",
      "herons",
      "frogs",
      "Frogs (heralds of rain)",
      "jaguars",
      "serpents",
      "snails",
      "Mount Tlaloc",
      "where his main shrine stood 4",
      "120 meters high",
      "His most distinctive feature - circular rings around the eyes",
      "possibly representing rain clouds",
      "water",
      "or serpent coils"
    ]
  },
  "name": "Tlaloc",
  "primarySources": [],
  "attributes": [],
  "id": "tlaloc",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Zeus\n                        Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Thor\n                        Norse",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Indra\n                        Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "🐉\n                        Dragon Kings\n                        Chinese",
      "link": "../../chinese/deities/dragon-kings.html"
    }
  ]
}
```

</details>

---

### `babylonian` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: ea</summary>

```json
{
  "epithets": [
    "Lord of the Apsû",
    "Nudimmud (Creator)",
    "King of the Fresh Waters"
  ],
  "displayName": "Ea (Enki)",
  "description": "Lord of the Apsû, God of Wisdom and Magic",
  "domains": [
    "Lord of the Apsû",
    "Nudimmud (Creator)",
    "King of the Fresh Waters",
    "Wisdom",
    "magic",
    "crafts",
    "fresh water",
    "creation",
    "incantations"
  ],
  "title": "Babylonian - Ea",
  "symbols": [
    "Goat-fish (Capricorn)",
    "flowing water",
    "magical staff",
    "Goat",
    "fish",
    "goat-fish hybrid",
    "ram",
    "Reeds (from marshes)",
    "tamarisk"
  ],
  "mythology": "babylonian",
  "relationships": {
    "children": [
      "marduk (supreme king of gods)",
      "successor)",
      "humanity (whom he favors)",
      "forces of chaos",
      "those who threaten cosmic order or humanity"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "marduk (supreme king of gods)",
        "successor)",
        "humanity (whom he favors)",
        "forces of chaos",
        "those who threaten cosmic order or humanity"
      ]
    },
    "epithets": [
      "Lord of the Apsû",
      "Nudimmud (Creator)",
      "King of the Fresh Waters"
    ],
    "archetypes": [],
    "displayName": "Ea (Enki)",
    "domains": [
      "Lord of the Apsû",
      "Nudimmud (Creator)",
      "King of the Fresh Waters",
      "Wisdom",
      "magic",
      "crafts",
      "fresh water",
      "creation",
      "incantations"
    ],
    "attributes": [],
    "symbols": [
      "Goat-fish (Capricorn)",
      "flowing water",
      "magical staff",
      "Goat",
      "fish",
      "goat-fish hybrid",
      "ram",
      "Reeds (from marshes)",
      "tamarisk"
    ]
  },
  "name": "Ea",
  "primarySources": [
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Nudimmud",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Other",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=other"
    },
    {
      "term": "Key Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Primordial Waters",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Cosmic",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cosmic"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Great Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Utnapishtim",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Family",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=family"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Deities",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=deities"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=texts"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Relationships",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=relationships"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Asalluhi",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Shamash",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=shamash"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Cosmic",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cosmic"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Primary",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Rituals",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=rituals"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Deep",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Apsû",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Anunnaki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    }
  ],
  "attributes": [],
  "id": "ea",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "🌊\n                    Cosmic Realm\n                \n                \n                    The Apsu\n                    Underground freshwater ocean",
      "link": "../cosmology/apsu.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Enki\n                Sumerian",
      "link": "../../sumerian/deities/enki.html"
    },
    {
      "type": "deity",
      "name": "🐦\n                Thoth\n                Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "🔱\n                Poseidon\n                Greek",
      "link": "../../greek/deities/poseidon.html"
    },
    {
      "type": "deity",
      "name": "🪶\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🔥\n                Prometheus\n                Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "deity",
      "name": "🏺 Enki (Sumerian)",
      "link": "../../sumerian/deities/enki.html"
    },
    {
      "type": "cosmology",
      "name": "🌊 Apsu",
      "link": "../cosmology/apsu.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Enuma Elish",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Apsu: The Primordial Waters and Ea's Domain",
      "link": "../cosmology/apsu.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: ishtar</summary>

```json
{
  "epithets": [
    "Queen of Heaven",
    "Lady of Battles",
    "Goddess of the Morning/Evening Star"
  ],
  "displayName": "⭐ Ishtar",
  "description": "Queen of Heaven, Lady of Battles",
  "domains": [
    "Queen of Heaven",
    "Lady of Battles",
    "Goddess of the Morning/Evening Star",
    "Love",
    "sexuality",
    "fertility",
    "war",
    "political power",
    "desire"
  ],
  "title": "Babylonian - Ishtar",
  "symbols": [
    "Eight-pointed star",
    "lion",
    "rose",
    "ring and staff",
    "Lion",
    "dove",
    "serpent",
    "Rose",
    "myrtle",
    "cedar",
    "date palm"
  ],
  "mythology": "babylonian",
  "relationships": {
    "children": [
      "variable in myths; sometimes none"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "variable in myths; sometimes none"
      ]
    },
    "epithets": [
      "Queen of Heaven",
      "Lady of Battles",
      "Goddess of the Morning/Evening Star"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Queen of Heaven",
      "Lady of Battles",
      "Goddess of the Morning/Evening Star",
      "Love",
      "sexuality",
      "fertility",
      "war",
      "political power",
      "desire"
    ],
    "attributes": [],
    "symbols": [
      "Eight-pointed star",
      "lion",
      "rose",
      "ring and staff",
      "Lion",
      "dove",
      "serpent",
      "Rose",
      "myrtle",
      "cedar",
      "date palm"
    ]
  },
  "name": "Ishtar",
  "primarySources": [
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Queen of Heaven",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Morning Star",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "Queen of Heaven",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Evening Star",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Evening Star",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Key Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "The Shepherd",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Enkidu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enkidu"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Enkidu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enkidu"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Prayers",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=prayers"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=texts"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Prayers",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=prayers"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Relationships",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=relationships"
    },
    {
      "term": "Sin",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sin"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=myths"
    },
    {
      "term": "Shamash",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=shamash"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Primary",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    }
  ],
  "attributes": [],
  "id": "ishtar",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "The Underworld",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "hero",
      "name": "Gilgamesh",
      "link": "../../sumerian/heroes/gilgamesh.html"
    },
    {
      "type": "deity",
      "name": "Inanna",
      "link": "../../sumerian/deities/inanna.html"
    },
    {
      "type": "deity",
      "name": "Aphrodite",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "Freya",
      "link": "../../norse/deities/freya.html"
    },
    {
      "type": "deity",
      "name": "Hathor",
      "link": "../../egyptian/deities/hathor.html"
    },
    {
      "type": "deity",
      "name": "Kali",
      "link": "../../hindu/deities/kali.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Inanna\n                Sumerian",
      "link": "../../sumerian/deities/inanna.html"
    },
    {
      "type": "deity",
      "name": "🕊️\n                Aphrodite\n                Greek",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "❄️\n                Freya\n                Norse",
      "link": "../../norse/deities/freya.html"
    },
    {
      "type": "deity",
      "name": "🐄\n                Hathor\n                Egyptian",
      "link": "../../egyptian/deities/hathor.html"
    },
    {
      "type": "deity",
      "name": "🏺 Inanna (Sumerian)",
      "link": "../../sumerian/deities/inanna.html"
    },
    {
      "type": "cosmology",
      "name": "⚰️ Descent to Underworld",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "hero",
      "name": "⚔️ Gilgamesh",
      "link": "../../sumerian/heroes/gilgamesh.html"
    },
    {
      "type": "deity",
      "name": "🌾 Tammuz/Dumuzi",
      "link": "../../sumerian/deities/dumuzi.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: marduk</summary>

```json
{
  "epithets": [
    "Bēl (Lord)",
    "King of the Gods",
    "Supreme Judge"
  ],
  "displayName": "👑 Marduk",
  "description": "Bēl - Lord of Lords, King of the Gods",
  "domains": [
    "Bēl (Lord)",
    "King of the Gods",
    "Supreme Judge",
    "Kingship",
    "creation",
    "justice",
    "magic",
    "storms",
    "order"
  ],
  "title": "Babylonian - Marduk",
  "symbols": [
    "Dragon (mušḫuššu)",
    "spade/hoe",
    "Tablet of Destinies",
    "horse",
    "Cedar",
    "cypress"
  ],
  "mythology": "babylonian",
  "relationships": {
    "children": [
      "nabu (god of writing",
      "wisdom)",
      "ea his father",
      "kingu (tiamat's consort)",
      "the eleven monsters of tiamat"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "nabu (god of writing",
        "wisdom)",
        "ea his father",
        "kingu (tiamat's consort)",
        "the eleven monsters of tiamat"
      ]
    },
    "epithets": [
      "Bēl (Lord)",
      "King of the Gods",
      "Supreme Judge"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Bēl (Lord)",
      "King of the Gods",
      "Supreme Judge",
      "Kingship",
      "creation",
      "justice",
      "magic",
      "storms",
      "order"
    ],
    "attributes": [],
    "symbols": [
      "Dragon (mušḫuššu)",
      "spade/hoe",
      "Tablet of Destinies",
      "horse",
      "Cedar",
      "cypress"
    ]
  },
  "name": "Marduk",
  "primarySources": [
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "King of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "King of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Order",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=order"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "King of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Key Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Chaos Dragon",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Fifty Names",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Fifty Names",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Babylonian Creation Epic",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Relationships",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=relationships"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Deities",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=deities"
    },
    {
      "term": "Deities",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=deities"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Anunnaki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Great Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Shamash",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=shamash"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=texts"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Primary",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary"
    },
    {
      "term": "Esagila",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=esagila"
    },
    {
      "term": "Etemenanki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=etemenanki"
    },
    {
      "term": "House of the Foundation of Heaven and Earth",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=etemenanki"
    },
    {
      "term": "Tower of Babel",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=etemenanki"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Esagila",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=esagila"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Fifty Names",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Related Concepts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Scribe of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Order",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=order"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Deities",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=deities"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    }
  ],
  "attributes": [],
  "id": "marduk",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Enuma Elish",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Apsu",
      "link": "../cosmology/apsu.html"
    },
    {
      "type": "deity",
      "name": "An (Anu)",
      "link": "../../sumerian/deities/an.html"
    },
    {
      "type": "deity",
      "name": "Enlil (Ellil)",
      "link": "../../sumerian/deities/enlil.html"
    },
    {
      "type": "deity",
      "name": "Enki",
      "link": "../../sumerian/deities/enki.html"
    },
    {
      "type": "deity",
      "name": "Zeus",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "Odin",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "Ra",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "⚡\n                Zeus\n                Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Jupiter\n                Roman",
      "link": "../../roman/deities/jupiter.html"
    },
    {
      "type": "deity",
      "name": "🌬️\n                Enlil\n                Sumerian",
      "link": "../../sumerian/deities/enlil.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Indra\n                Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Ra\n                Egyptian",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Enuma Elish",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "🌬️ Enlil (Predecessor)",
      "link": "../../sumerian/deities/enlil.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: nabu</summary>

```json
{
  "epithets": [
    "Divine Scribe",
    "Lord of Wisdom",
    "Announcer of the Gods"
  ],
  "displayName": "📜 Nabu",
  "description": "Divine Scribe, God of Wisdom and Writing",
  "domains": [
    "Divine Scribe",
    "Lord of Wisdom",
    "Announcer of the Gods",
    "Writing",
    "wisdom",
    "scribal arts",
    "prophecy",
    "vegetation",
    "rational thought"
  ],
  "title": "Babylonian - Nabu",
  "symbols": [
    "Stylus and clay tablet",
    "Tablet of Destinies",
    "wedge (cuneiform)",
    "Dragon (sometimes shared with Marduk)",
    "serpent",
    "Date palm",
    "grain",
    "all cultivated plants (writing enables agriculture)"
  ],
  "mythology": "babylonian",
  "relationships": {
    "children": [
      "king)",
      "shamash (god of justice - both value truth)",
      "ignorance",
      "those who would destroy written records"
    ],
    "father": "and king)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "king)",
        "shamash (god of justice - both value truth)",
        "ignorance",
        "those who would destroy written records"
      ],
      "father": "and king)"
    },
    "epithets": [
      "Divine Scribe",
      "Lord of Wisdom",
      "Announcer of the Gods"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Divine Scribe",
      "Lord of Wisdom",
      "Announcer of the Gods",
      "Writing",
      "wisdom",
      "scribal arts",
      "prophecy",
      "vegetation",
      "rational thought"
    ],
    "attributes": [],
    "symbols": [
      "Stylus and clay tablet",
      "Tablet of Destinies",
      "wedge (cuneiform)",
      "Dragon (sometimes shared with Marduk)",
      "serpent",
      "Date palm",
      "grain",
      "all cultivated plants (writing enables agriculture)"
    ]
  },
  "name": "Nabu",
  "primarySources": [
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Divine Decrees",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Lord of Wisdom",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Cuneiform",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sources",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sources"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Key Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Scribe of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma%20elish"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Relationships",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=relationships"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Shamash",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=shamash"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Ezida",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Cuneiform",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Cuneiform",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Cuneiform",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Texts",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=texts"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Nabu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    }
  ],
  "attributes": [],
  "id": "nabu",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Thoth",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "Hermes",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "Ganesha",
      "link": "../../hindu/deities/ganesha.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: nergal</summary>

```json
{
  "epithets": [
    "Erra",
    "Meslamtaea (\"He Who Comes Forth from Meslam\")"
  ],
  "displayName": "⚔️ Nergal",
  "description": "Lord of the Underworld - God of War, Plague, and Death",
  "domains": [
    "Erra",
    "Meslamtaea (\"He Who Comes Forth from Meslam\")",
    "War",
    "plague",
    "death",
    "underworld",
    "fire",
    "destruction",
    "summer heat"
  ],
  "title": "Babylonian - Nergal",
  "symbols": [
    "Mace",
    "sword",
    "double-headed axe",
    "scimitar",
    "Lion",
    "rooster (herald of war)",
    "Tamarisk",
    "cypress (funeral trees)"
  ],
  "mythology": "babylonian",
  "relationships": {
    "children": [
      "various plague demons",
      "the sebetti (warrior-spirits)",
      "namtar (plague demon",
      "fever spirits",
      "death messengers\nopposed by: healing deities",
      "protective spirits who defend against his plagues"
    ],
    "consort": "ereshkigal (queen of the underworld)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "various plague demons",
        "the sebetti (warrior-spirits)",
        "namtar (plague demon",
        "fever spirits",
        "death messengers\nopposed by: healing deities",
        "protective spirits who defend against his plagues"
      ],
      "consort": "ereshkigal (queen of the underworld)"
    },
    "epithets": [
      "Erra",
      "Meslamtaea (\"He Who Comes Forth from Meslam\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Erra",
      "Meslamtaea (\"He Who Comes Forth from Meslam\")",
      "War",
      "plague",
      "death",
      "underworld",
      "fire",
      "destruction",
      "summer heat"
    ],
    "attributes": [],
    "symbols": [
      "Mace",
      "sword",
      "double-headed axe",
      "scimitar",
      "Lion",
      "rooster (herald of war)",
      "Tamarisk",
      "cypress (funeral trees)"
    ]
  },
  "name": "Nergal",
  "primarySources": [
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Land of No Return",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Attributes",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=attributes"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Meslamtaea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Mythology",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=mythology"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Key Myths",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Divine",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=divine"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Rituals",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=rituals"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Primary",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Other",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=other"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Great Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "King of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Within",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=within"
    },
    {
      "term": "Erra",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Irkalla",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ishtar",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Relationships",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=relationships"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Deities",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=deities"
    },
    {
      "term": "Enemies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enemies"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Primary",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=primary"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Rituals",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=rituals"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Rituals",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=rituals"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Offerings",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=offerings"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Invocations",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=invocations"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Worship",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=worship"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Traditions",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=traditions"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Babylonian",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=babylonian"
    }
  ],
  "attributes": [],
  "id": "nergal",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "underworld",
      "link": "../../greek/cosmology/underworld.html"
    },
    {
      "type": "deity",
      "name": "Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "cosmology",
      "name": "The Underworld",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "deity",
      "name": "Ares",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "Hades",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "Yama",
      "link": "../../hindu/deities/yama.html"
    },
    {
      "type": "deity",
      "name": "Sekhmet",
      "link": "../../egyptian/deities/sekhmet.html"
    },
    {
      "type": "deity",
      "name": "Hel",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "Sumerian Ereshkigal",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "Hades",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "Ares",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "Sekhmet",
      "link": "../../egyptian/deities/sekhmet.html"
    },
    {
      "type": "cosmology",
      "name": "The Underworld",
      "link": "../cosmology/afterlife.html"
    }
  ]
}
```

</details>

---

### `buddhist` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: avalokiteshvara</summary>

```json
{
  "epithets": [
    "Avalokiteshvara",
    "Padmapani (Lotus-Bearer)",
    "Lokeshvara (Lord of the World)",
    "Guanyin (觀音)",
    "Guanshiyin (觀世音)",
    "Kannon (観音)",
    "Kanzeon (観世音)",
    "Chenrezig (སྤྱན་རས་གཟིགས།) - \"The One Who Looks with Clear Eyes\""
  ],
  "displayName": "Avalokiteshvara (观音 / སྤྱན་རས་གཟིགས།)",
  "description": "The Lord Who Looks Down with Compassion",
  "domains": [],
  "title": "Avalokiteshvara\" - Buddhist Mythology",
  "symbols": [
    "Om Mani Padme Hum (ॐ मणि पद्मे हूँ)\n                        \"The Jewel in the Lotus\"",
    "White Lotus",
    "Prayer Beads (mala)",
    "Wish-Fulfilling Jewel (cintamani)",
    "Water Vase (amrita)",
    "potalaka\n                        (mythical island paradise)",
    "Closes the doors to unfortunate rebirths",
    "Develops compassion in the practitioner's mind",
    "Accumulates merit leading toward enlightenment",
    "Protects from fears, dangers, and obstacles"
  ],
  "mythology": "buddhist",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Avalokiteshvara",
      "Padmapani (Lotus-Bearer)",
      "Lokeshvara (Lord of the World)",
      "Guanyin (觀音)",
      "Guanshiyin (觀世音)",
      "Kannon (観音)",
      "Kanzeon (観世音)",
      "Chenrezig (སྤྱན་རས་གཟིགས།) - \"The One Who Looks with Clear Eyes\""
    ],
    "archetypes": [],
    "displayName": "Avalokiteshvara (观音 / སྤྱན་རས་གཟིགས།)",
    "domains": [],
    "attributes": [],
    "symbols": [
      "Om Mani Padme Hum (ॐ मणि पद्मे हूँ)\n                        \"The Jewel in the Lotus\"",
      "White Lotus",
      "Prayer Beads (mala)",
      "Wish-Fulfilling Jewel (cintamani)",
      "Water Vase (amrita)",
      "potalaka\n                        (mythical island paradise)",
      "Closes the doors to unfortunate rebirths",
      "Develops compassion in the practitioner's mind",
      "Accumulates merit leading toward enlightenment",
      "Protects from fears, dangers, and obstacles"
    ]
  },
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "avalokiteshvara",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "The Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "hero",
      "name": "Dalai Lamas",
      "link": "../heroes/dalai_lama.html"
    },
    {
      "type": "hero",
      "name": "King Songtsen Gampo",
      "link": "../heroes/king_songtsen_gampo.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../deities/avalokiteshvara.html"
    },
    {
      "type": "cosmology",
      "name": "Potala Palace",
      "link": "../cosmology/potala_palace.html"
    },
    {
      "type": "deity",
      "name": "Vishnu",
      "link": "../../hindu/deities/vishnu.html"
    },
    {
      "type": "cosmology",
      "name": "Potala Palace",
      "link": "../cosmology/potala_palace.html"
    },
    {
      "type": "hero",
      "name": "Dalai Lamas",
      "link": "../heroes/dalai_lama.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: avalokiteshvara_detailed</summary>

```json
{
  "epithets": [],
  "displayName": "🔄 Redirecting...",
  "description": "",
  "domains": [],
  "title": "Redirecting to Avalokiteshvara",
  "symbols": [],
  "mythology": "buddhist",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Redirecting to Avalokiteshvara",
  "primarySources": [],
  "attributes": [],
  "id": "avalokiteshvara_detailed",
  "relatedEntities": []
}
```

</details>

<details>
<summary>Document 3: buddha</summary>

```json
{
  "epithets": [
    "The Awakened One",
    "Tathagata (Thus-Gone One)",
    "Shakyamuni (Sage of the Shakyas)",
    "World-Honored One"
  ],
  "displayName": "🧘 Buddha Shakyamuni",
  "description": "The Enlightened One, Teacher of Liberation",
  "domains": [
    "The Awakened One",
    "Tathagata (Thus-Gone One)",
    "Shakyamuni (Sage of the Shakyas)",
    "World-Honored One"
  ],
  "title": "Buddha\" - Buddhist Mythology",
  "symbols": [
    "Dharma Wheel",
    "Bodhi Tree",
    "Lotus Flower",
    "Begging Bowl",
    "Meditation Posture",
    "Bodhi Tree (Ficus religiosa)",
    "Lotus",
    "Bodh Gaya",
    "Sarnath",
    "Kushinagar",
    "Lumbini",
    "Lumbini, Nepal: Birthplace of the Buddha"
  ],
  "mythology": "buddhist",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "The Awakened One",
      "Tathagata (Thus-Gone One)",
      "Shakyamuni (Sage of the Shakyas)",
      "World-Honored One"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "The Awakened One",
      "Tathagata (Thus-Gone One)",
      "Shakyamuni (Sage of the Shakyas)",
      "World-Honored One"
    ],
    "attributes": [],
    "symbols": [
      "Dharma Wheel",
      "Bodhi Tree",
      "Lotus Flower",
      "Begging Bowl",
      "Meditation Posture",
      "Bodhi Tree (Ficus religiosa)",
      "Lotus",
      "Bodh Gaya",
      "Sarnath",
      "Kushinagar",
      "Lumbini",
      "Lumbini, Nepal: Birthplace of the Buddha"
    ]
  },
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "buddha",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "The Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "The Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "The Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "cosmology",
      "name": "cycle of rebirth",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "deity",
      "name": "The Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "the Buddha",
      "link": "../deities/gautama_buddha.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Krishna\n                Hindu",
      "link": "../../hindu/deities/krishna.html"
    },
    {
      "type": "hero",
      "name": "🔥\n                Zoroaster\n                Zoroastrian",
      "link": "../../persian/heroes/zoroaster.html"
    },
    {
      "type": "hero",
      "name": "✡️\n                Moses\n                Jewish",
      "link": "../../jewish/heroes/moses.html"
    },
    {
      "type": "cosmology",
      "name": "✨ Nirvana",
      "link": "../cosmology/nirvana.html"
    },
    {
      "type": "cosmology",
      "name": "🔄 Samsara",
      "link": "../cosmology/samsara.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: gautama_buddha</summary>

```json
{
  "epithets": [
    "Tathagata (Thus-Gone One)",
    "Shakyamuni (Sage of the Shakyas)",
    "Bhagavan (World-Honored One)",
    "Jina (Victorious One)"
  ],
  "displayName": "Gautama Buddha (Shakyamuni)",
  "description": "The Awakened One, Teacher of the Dharma",
  "domains": [
    "Tathagata (Thus-Gone One)",
    "Shakyamuni (Sage of the Shakyas)",
    "Bhagavan (World-Honored One)",
    "Jina (Victorious One)"
  ],
  "title": "Gautama Buddha\" - Buddhist Mythology",
  "symbols": [
    "Dharma Wheel",
    "Bodhi Tree",
    "Lotus Flower",
    "Begging Bowl",
    "Bodhi Tree (Ficus religiosa)",
    "Lotus (Nelumbo nucifera)",
    "Sal Tree (Shorea robusta)",
    "Lumbini (birth)",
    "Bodh Gaya (enlightenment)",
    "Sarnath (first teaching)",
    "Kushinagar (parinirvana)"
  ],
  "mythology": "buddhist",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Tathagata (Thus-Gone One)",
      "Shakyamuni (Sage of the Shakyas)",
      "Bhagavan (World-Honored One)",
      "Jina (Victorious One)"
    ],
    "archetypes": [],
    "displayName": "Gautama Buddha (Shakyamuni)",
    "domains": [
      "Tathagata (Thus-Gone One)",
      "Shakyamuni (Sage of the Shakyas)",
      "Bhagavan (World-Honored One)",
      "Jina (Victorious One)"
    ],
    "attributes": [],
    "symbols": [
      "Dharma Wheel",
      "Bodhi Tree",
      "Lotus Flower",
      "Begging Bowl",
      "Bodhi Tree (Ficus religiosa)",
      "Lotus (Nelumbo nucifera)",
      "Sal Tree (Shorea robusta)",
      "Lumbini (birth)",
      "Bodh Gaya (enlightenment)",
      "Sarnath (first teaching)",
      "Kushinagar (parinirvana)"
    ]
  },
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "gautama_buddha",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "cosmology",
      "name": "cycle of rebirth",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "cosmology",
      "name": "Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "hero",
      "name": "Nagarjuna",
      "link": "../heroes/nagarjuna.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Krishna\n                Hindu",
      "link": "../../hindu/deities/krishna.html"
    },
    {
      "type": "hero",
      "name": "🔥\n                Zoroaster\n                Zoroastrian",
      "link": "../../persian/heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "🔄 Samsara",
      "link": "../cosmology/samsara.html"
    },
    {
      "type": "cosmology",
      "name": "✨ Nirvana",
      "link": "../cosmology/nirvana.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: guanyin</summary>

```json
{
  "epithets": [],
  "displayName": "🌸 Guanyin",
  "description": "Goddess of Mercy and Compassion",
  "domains": [],
  "title": "Avalokiteshvara\" - Buddhist Mythology",
  "symbols": [],
  "mythology": "buddhist",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "guanyin",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "☥\n                Isis\n                Egyptian",
      "link": "../../egyptian/deities/isis.html"
    }
  ]
}
```

</details>

---

### `celtic` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: aengus</summary>

```json
{
  "epithets": [
    "Aengus Óg (Young Aengus)",
    "Mac Óg (The Young Son)",
    "Mac ind Óc",
    "Aengus of the Brugh",
    "The Dream Lord"
  ],
  "displayName": "Aengus Óg (Oengus, Mac Óg)",
  "description": "God of Love, Youth, and Poetic Inspiration",
  "domains": [
    "Aengus Óg (Young Aengus)",
    "Mac Óg (The Young Son)",
    "Mac ind Óc",
    "Aengus of the Brugh",
    "The Dream Lord",
    "Love",
    "youth",
    "beauty",
    "poetry",
    "dreams",
    "music",
    "inspiration",
    "protection of lovers",
    "summer"
  ],
  "title": "Celtic - Aengus Óg",
  "symbols": [
    "Four birds circling his head (kisses transformed)",
    "harp",
    "golden hair",
    "the Brugh na Bóinne",
    "Swans (especially paired swans)",
    "songbirds",
    "the four birds of his kisses",
    "Hawthorn (the fairy tree)",
    "apple blossoms",
    "roses",
    "mistletoe"
  ],
  "mythology": "celtic",
  "relationships": {
    "children": [
      "goddess of fire",
      "poetry)",
      "bodb derg",
      "midir (half-brothers through the dagda)",
      "lovers everywhere",
      "poets",
      "musicians",
      "gráinne); anyone who acts against love"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "goddess of fire",
        "poetry)",
        "bodb derg",
        "midir (half-brothers through the dagda)",
        "lovers everywhere",
        "poets",
        "musicians",
        "gráinne); anyone who acts against love"
      ]
    },
    "epithets": [
      "Aengus Óg (Young Aengus)",
      "Mac Óg (The Young Son)",
      "Mac ind Óc",
      "Aengus of the Brugh",
      "The Dream Lord"
    ],
    "archetypes": [],
    "displayName": "Aengus Óg (Oengus, Mac Óg)",
    "domains": [
      "Aengus Óg (Young Aengus)",
      "Mac Óg (The Young Son)",
      "Mac ind Óc",
      "Aengus of the Brugh",
      "The Dream Lord",
      "Love",
      "youth",
      "beauty",
      "poetry",
      "dreams",
      "music",
      "inspiration",
      "protection of lovers",
      "summer"
    ],
    "attributes": [],
    "symbols": [
      "Four birds circling his head (kisses transformed)",
      "harp",
      "golden hair",
      "the Brugh na Bóinne",
      "Swans (especially paired swans)",
      "songbirds",
      "the four birds of his kisses",
      "Hawthorn (the fairy tree)",
      "apple blossoms",
      "roses",
      "mistletoe"
    ]
  },
  "name": "Aengus Óg",
  "primarySources": [
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus Óg",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Key Myths",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Enemies",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred Sites",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Invocations",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Aengus",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    }
  ],
  "attributes": [],
  "id": "aengus",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Eros\n                Greek",
      "link": "../../../mythos/greek/deities/eros.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Cupid\n                Roman",
      "link": "../../../mythos/roman/deities/cupid.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Apollo\n                Greek",
      "link": "../../../mythos/greek/deities/apollo.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: brigid</summary>

```json
{
  "epithets": [
    "Brigid the Exalted",
    "Bride",
    "Brigantia",
    "Brigandu",
    "The Poetess",
    "Lady of the Sacred Flame"
  ],
  "displayName": "Brigid (Brighid, Bríg)",
  "description": "Goddess of Fire, Poetry, and Healing",
  "domains": [
    "Brigid the Exalted",
    "Bride",
    "Brigantia",
    "Brigandu",
    "The Poetess",
    "Lady of the Sacred Flame",
    "Fire",
    "poetry",
    "healing",
    "smithcraft",
    "sacred wells",
    "fertility",
    "midwifery",
    "protection",
    "inspiration"
  ],
  "title": "Celtic - Brigid",
  "symbols": [
    "Eternal flame",
    "Brigid's cross",
    "sacred wells",
    "white cow",
    "serpent emerging from hill (Imbolc)",
    "White cow (fertility)",
    "ewes (Imbolc)",
    "serpents (transformation)",
    "bees (poetry/sweetness)",
    "Blackberry",
    "oak",
    "rushes (for crosses)",
    "dandelion",
    "heather",
    "rowan"
  ],
  "mythology": "celtic",
  "relationships": {
    "mother": "- sources vary)",
    "children": [
      "ruadán (killed in the battle of magh tuireadh)",
      "god of love)",
      "bodb derg (brother",
      "later king)",
      "midir",
      "particularly her father the dagda; poets",
      "healers",
      "smiths who serve her crafts; the l",
      "reconciliation rather than warfare",
      "though she supports her people against oppression"
    ],
    "father": "the dagda; poets"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "- sources vary)",
      "children": [
        "ruadán (killed in the battle of magh tuireadh)",
        "god of love)",
        "bodb derg (brother",
        "later king)",
        "midir",
        "particularly her father the dagda; poets",
        "healers",
        "smiths who serve her crafts; the l",
        "reconciliation rather than warfare",
        "though she supports her people against oppression"
      ],
      "father": "the dagda; poets"
    },
    "epithets": [
      "Brigid the Exalted",
      "Bride",
      "Brigantia",
      "Brigandu",
      "The Poetess",
      "Lady of the Sacred Flame"
    ],
    "archetypes": [],
    "displayName": "Brigid (Brighid, Bríg)",
    "domains": [
      "Brigid the Exalted",
      "Bride",
      "Brigantia",
      "Brigandu",
      "The Poetess",
      "Lady of the Sacred Flame",
      "Fire",
      "poetry",
      "healing",
      "smithcraft",
      "sacred wells",
      "fertility",
      "midwifery",
      "protection",
      "inspiration"
    ],
    "attributes": [],
    "symbols": [
      "Eternal flame",
      "Brigid's cross",
      "sacred wells",
      "white cow",
      "serpent emerging from hill (Imbolc)",
      "White cow (fertility)",
      "ewes (Imbolc)",
      "serpents (transformation)",
      "bees (poetry/sweetness)",
      "Blackberry",
      "oak",
      "rushes (for crosses)",
      "dandelion",
      "heather",
      "rowan"
    ]
  },
  "name": "Brigid",
  "primarySources": [
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brighid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Bríg",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Bride",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Three",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic Tradition",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Key Myths",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Enemies",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred Sites",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "In the Belly",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Invocations",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    }
  ],
  "attributes": [],
  "id": "brigid",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Athena\n                Greek",
      "link": "../../../mythos/greek/deities/athena.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Hestia\n                Greek",
      "link": "../../../mythos/greek/deities/hestia.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Vesta\n                Roman",
      "link": "../../../mythos/roman/deities/vesta.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Saraswati\n                Hindu",
      "link": "../../../mythos/hindu/deities/saraswati.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Minerva\n                Roman",
      "link": "../../../mythos/roman/deities/minerva.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: cernunnos</summary>

```json
{
  "epithets": [
    "The Horned One",
    "Lord of the Animals",
    "Master of the Hunt",
    "God of Wild Places",
    "Lord of the Forest",
    "Keeper of the Torc"
  ],
  "displayName": "🦌 Cernunnos",
  "description": "The Horned God of Wild Nature",
  "domains": [
    "The Horned One",
    "Lord of the Animals",
    "Master of the Hunt",
    "God of Wild Places",
    "Lord of the Forest",
    "Keeper of the Torc",
    "Wild nature",
    "animals",
    "forests",
    "fertility",
    "wealth",
    "the underworld",
    "life-death-rebirth cycle",
    "hunting",
    "abundance"
  ],
  "title": "Celtic - Cernunnos",
  "symbols": [
    "Stag antlers",
    "torc (neck ring)",
    "serpent with ram's horns",
    "bag of coins",
    "seated cross-legged posture",
    "Stag (primary)",
    "ram-horned serpent",
    "bull",
    "wolf",
    "bear",
    "boar",
    "all wild creatures",
    "Oak",
    "holly",
    "ivy",
    "mistletoe",
    "ferns",
    "mushrooms",
    "all forest growth"
  ],
  "mythology": "celtic",
  "relationships": {
    "mother": "goddess figure; some scholars associate him with danu or similar earth mother figures",
    "children": [
      "none specifically named",
      "nature"
    ],
    "father": "to many"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "goddess figure; some scholars associate him with danu or similar earth mother figures",
      "children": [
        "none specifically named",
        "nature"
      ],
      "father": "to many"
    },
    "epithets": [
      "The Horned One",
      "Lord of the Animals",
      "Master of the Hunt",
      "God of Wild Places",
      "Lord of the Forest",
      "Keeper of the Torc"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "The Horned One",
      "Lord of the Animals",
      "Master of the Hunt",
      "God of Wild Places",
      "Lord of the Forest",
      "Keeper of the Torc",
      "Wild nature",
      "animals",
      "forests",
      "fertility",
      "wealth",
      "the underworld",
      "life-death-rebirth cycle",
      "hunting",
      "abundance"
    ],
    "attributes": [],
    "symbols": [
      "Stag antlers",
      "torc (neck ring)",
      "serpent with ram's horns",
      "bag of coins",
      "seated cross-legged posture",
      "Stag (primary)",
      "ram-horned serpent",
      "bull",
      "wolf",
      "bear",
      "boar",
      "all wild creatures",
      "Oak",
      "holly",
      "ivy",
      "mistletoe",
      "ferns",
      "mushrooms",
      "all forest growth"
    ]
  },
  "name": "Cernunnos",
  "primarySources": [
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Key",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Enemies",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred Sites",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Invocations",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Cernunnos",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    }
  ],
  "attributes": [],
  "id": "cernunnos",
  "relatedEntities": []
}
```

</details>

<details>
<summary>Document 4: dagda</summary>

```json
{
  "epithets": [
    "The Good God (Dagda = \"good god\")",
    "Eochaid Ollathair (\"All-Father\")",
    "Ruad Rofhessa (\"Red One of Great Knowledge\")"
  ],
  "displayName": "⚡ The Dagda",
  "description": "The Good God, Father of All",
  "domains": [
    "The Good God (Dagda = \"good god\")",
    "Eochaid Ollathair (\"All-Father\")",
    "Ruad Rofhessa (\"Red One of Great Knowledge\")",
    "Abundance",
    "protection",
    "magic",
    "time",
    "seasons",
    "life",
    "death",
    "druidry",
    "oaths"
  ],
  "title": "The",
  "symbols": [
    "Cauldron of plenty",
    "mighty club",
    "magical harp (Uaithne)",
    "oak trees",
    "Bulls",
    "boars",
    "horses",
    "Oak (Dair)",
    "hazel",
    "all grains and crops"
  ],
  "mythology": "celtic",
  "relationships": {
    "mother": "goddess)",
    "children": [
      "brigid (goddess of fire",
      "poetry)",
      "aengus óg (god of love",
      "youth)",
      "bodb derg (later king of the tuatha dé danann)",
      "cermait (father of smithing gods)",
      "midir the proud",
      "aed",
      "numerous others\nsiblings: ogma (god of eloquence)",
      "particularly lugh (champion)",
      "ogma (brother",
      "war companion)",
      "bres (the unjust king)",
      "forces of chaos",
      "sterility"
    ],
    "father": "of smithing gods)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "goddess)",
      "children": [
        "brigid (goddess of fire",
        "poetry)",
        "aengus óg (god of love",
        "youth)",
        "bodb derg (later king of the tuatha dé danann)",
        "cermait (father of smithing gods)",
        "midir the proud",
        "aed",
        "numerous others\nsiblings: ogma (god of eloquence)",
        "particularly lugh (champion)",
        "ogma (brother",
        "war companion)",
        "bres (the unjust king)",
        "forces of chaos",
        "sterility"
      ],
      "father": "of smithing gods)"
    },
    "epithets": [
      "The Good God (Dagda = \"good god\")",
      "Eochaid Ollathair (\"All-Father\")",
      "Ruad Rofhessa (\"Red One of Great Knowledge\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "The Good God (Dagda = \"good god\")",
      "Eochaid Ollathair (\"All-Father\")",
      "Ruad Rofhessa (\"Red One of Great Knowledge\")",
      "Abundance",
      "protection",
      "magic",
      "time",
      "seasons",
      "life",
      "death",
      "druidry",
      "oaths"
    ],
    "attributes": [],
    "symbols": [
      "Cauldron of plenty",
      "mighty club",
      "magical harp (Uaithne)",
      "oak trees",
      "Bulls",
      "boars",
      "horses",
      "Oak (Dair)",
      "hazel",
      "all grains and crops"
    ]
  },
  "name": "The",
  "primarySources": [
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Good God",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Father of All",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Good God",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Eochaid Ollathair",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Ruad Rofhessa",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Good God",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Key Myths",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Samhain",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Otherworld",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Enemies",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Lugh",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Enemies",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred Sites",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Samhain",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Samhain",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Lughnasadh",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Invocations",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Good God",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Eochaid Ollathair",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    }
  ],
  "attributes": [],
  "id": "dagda",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Zeus\n                Greek",
      "link": "../../../mythos/greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../../mythos/norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Jupiter\n                Roman",
      "link": "../../../mythos/roman/deities/jupiter.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Ra\n                Egyptian",
      "link": "../../../mythos/egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Indra\n                Hindu",
      "link": "../../../mythos/hindu/deities/indra.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: danu</summary>

```json
{
  "epithets": [
    "Danu",
    "Anu",
    "Dana",
    "Don (Welsh)",
    "Dôn"
  ],
  "displayName": "Danu (Anu, Dana)",
  "description": "The Primordial Mother Goddess",
  "domains": [
    "Danu",
    "Anu",
    "Dana",
    "Don (Welsh)",
    "Dôn",
    "Motherhood",
    "fertility",
    "earth",
    "rivers",
    "water",
    "sovereignty",
    "abundance",
    "ancestry",
    "the land itself"
  ],
  "title": "Celtic - Danu",
  "symbols": [
    "Rivers (especially Danube)",
    "hills and mountains",
    "fertile land",
    "flowing water",
    "the earth",
    "Paps of Anu (Dá Chích Anann) - two mountain peaks in County Kerry",
    "Ireland",
    "literally \"Breasts of Anu\"",
    "Earth (primarily)",
    "Water (rivers)",
    "Air (breath of life)"
  ],
  "mythology": "celtic",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Danu",
      "Anu",
      "Dana",
      "Don (Welsh)",
      "Dôn"
    ],
    "archetypes": [],
    "displayName": "Danu (Anu, Dana)",
    "domains": [
      "Danu",
      "Anu",
      "Dana",
      "Don (Welsh)",
      "Dôn",
      "Motherhood",
      "fertility",
      "earth",
      "rivers",
      "water",
      "sovereignty",
      "abundance",
      "ancestry",
      "the land itself"
    ],
    "attributes": [],
    "symbols": [
      "Rivers (especially Danube)",
      "hills and mountains",
      "fertile land",
      "flowing water",
      "the earth",
      "Paps of Anu (Dá Chích Anann) - two mountain peaks in County Kerry",
      "Ireland",
      "literally \"Breasts of Anu\"",
      "Earth (primarily)",
      "Water (rivers)",
      "Air (breath of life)"
    ]
  },
  "name": "Danu",
  "primarySources": [
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "People of the Goddess",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dôn",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred Sites",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Lugh",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "People of the Goddess",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dôn",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Stories",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Stories",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mother of the Gods",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Brigid",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Lugh",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Dagda",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "The Morrigan",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Imbolc",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Prayers",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Offerings",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Invocations",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Celtic",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Worship",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dôn",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Similar Deities In Other Traditions",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sources",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sources",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Tuatha Dé Danann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Anann",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Sources",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Dôn",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Myths",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Danu",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "celtic",
      "href": "../../../mythos/celtic/index.html"
    }
  ],
  "attributes": [],
  "id": "danu",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Gaia (Greek) - Primordial Earth Mother",
      "link": "../../greek/deities/gaia.html"
    },
    {
      "type": "deity",
      "name": "Jord (Norse) - Earth Goddess",
      "link": "../../norse/deities/jord.html"
    },
    {
      "type": "deity",
      "name": "Prithvi (Hindu) - Earth Mother",
      "link": "../../hindu/deities/prithvi.html"
    },
    {
      "type": "cosmology",
      "name": "🌍 Celtic Creation",
      "link": "../cosmology/creation.html"
    }
  ]
}
```

</details>

---

### `chinese` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: dragon-kings</summary>

```json
{
  "epithets": [],
  "displayName": "The Four Dragon Kings",
  "description": "The Four Dragon Kings are the divine rulers of the seas who control weather, rainfall, and all bodies of water in Chinese mythology. Dwelling in magnificent crystal palaces beneath the oceans, they command vast armies of aquatic creatures and serve under the authority of the Jade Emperor, regulating the waters that sustain all life.",
  "domains": [],
  "title": "Chinese - Dragon Kings",
  "symbols": [
    "Pig heads: Traditional meat offerings",
    "Wine and food: Elaborate feast offerings",
    "Incense: Continuous burning at temple altars",
    "Fishermen and sailors seeking safe voyages",
    "Farmers praying for adequate rainfall",
    "Communities threatened by floods",
    "Those living near rivers and coastlines",
    "Anyone whose livelihood depends on water"
  ],
  "mythology": "chinese",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": [
      "Pig heads: Traditional meat offerings",
      "Wine and food: Elaborate feast offerings",
      "Incense: Continuous burning at temple altars",
      "Fishermen and sailors seeking safe voyages",
      "Farmers praying for adequate rainfall",
      "Communities threatened by floods",
      "Those living near rivers and coastlines",
      "Anyone whose livelihood depends on water"
    ]
  },
  "name": "Dragon Kings",
  "primarySources": [
    {
      "term": "Dragon Kings",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon%20kings"
    },
    {
      "term": "Dragon Kings",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon%20kings"
    },
    {
      "term": "Dragon Kings",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon%20kings"
    }
  ],
  "attributes": [],
  "id": "dragon-kings",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏱\n                Poseidon\n                Greek",
      "link": "../../greek/deities/poseidon.html"
    },
    {
      "type": "deity",
      "name": "🌲\n                Tlaloc\n                Aztec",
      "link": "../../aztec/deities/tlaloc.html"
    },
    {
      "type": "deity",
      "name": "☀\n                Sobek\n                Egyptian",
      "link": "../../egyptian/deities/sobek.html"
    },
    {
      "type": "deity",
      "name": "Poseidon",
      "link": "../../greek/deities/poseidon.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: erlang-shen</summary>

```json
{
  "epithets": [],
  "displayName": "Erlang Shen",
  "description": "Erlang Shen is the formidable three-eyed warrior god of Chinese mythology, nephew of the Jade Emperor and master of seventy-two transformations. Armed with his legendary three-pointed double-edged lance and accompanied by his celestial hound Xiaotian, he serves as heaven's greatest demon-slayer and one of the few beings capable of matching the Monkey King in combat.",
  "domains": [],
  "title": "Chinese - Erlang Shen",
  "symbols": [
    "Wine: Offerings of alcohol for the warrior god",
    "Hunters and those who work with dogs",
    "Communities threatened by floods",
    "Those seeking justice against powerful enemies"
  ],
  "mythology": "chinese",
  "relationships": {
    "mother": "yaoji (瑶姬)",
    "children": [
      "nephew: chenxiang (沉香)"
    ],
    "father": "yang tianyou (杨天佑)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "yaoji (瑶姬)",
      "children": [
        "nephew: chenxiang (沉香)"
      ],
      "father": "yang tianyou (杨天佑)"
    },
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": [
      "Wine: Offerings of alcohol for the warrior god",
      "Hunters and those who work with dogs",
      "Communities threatened by floods",
      "Those seeking justice against powerful enemies"
    ]
  },
  "name": "Erlang Shen",
  "primarySources": [
    {
      "term": "Erlang Shen",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=erlang%20shen"
    },
    {
      "term": "Erlang Shen",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=erlang%20shen"
    },
    {
      "term": "Erlang Shen",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=erlang%20shen"
    }
  ],
  "attributes": [],
  "id": "erlang-shen",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "✝\n                Archangel Michael\n                Christian",
      "link": "../../christian/deities/michael.html"
    },
    {
      "type": "deity",
      "name": "🕉\n                Indra\n                Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "⚔\n                Thor\n                Norse",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "☀\n                Horus\n                Egyptian",
      "link": "../../egyptian/deities/horus.html"
    },
    {
      "type": "deity",
      "name": "🏱\n                Apollo\n                Greek",
      "link": "../../greek/deities/apollo.html"
    },
    {
      "type": "deity",
      "name": "Michael",
      "link": "../../christian/deities/michael.html"
    },
    {
      "type": "deity",
      "name": "Shiva",
      "link": "../../hindu/deities/shiva.html"
    },
    {
      "type": "deity",
      "name": "Thor",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "Horus",
      "link": "../../egyptian/deities/horus.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: guan-yu</summary>

```json
{
  "epithets": [
    "Lord Guan (關公)",
    "Emperor Guan (關帝)",
    "Martial God of Wealth",
    "Saint of War"
  ],
  "displayName": "⚔️ Guan Yu",
  "description": "關羽 (Guān Yǔ) - God of War, Righteousness, and Loyalty",
  "domains": [
    "Lord Guan (關公)",
    "Emperor Guan (關帝)",
    "Martial God of Wealth",
    "Saint of War",
    "War",
    "righteousness",
    "loyalty",
    "brotherhood",
    "justice",
    "commerce",
    "protection"
  ],
  "title": "Chinese - Guan Yu",
  "symbols": [
    "Green Dragon Crescent Blade (guandao)",
    "red face",
    "long beard",
    "Confucian texts",
    "Red Hare horse (赤兔馬)",
    "dragon (imperial association)",
    "Peach blossoms (brotherhood oath)",
    "bamboo (uprightness)"
  ],
  "mythology": "chinese",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Lord Guan (關公)",
      "Emperor Guan (關帝)",
      "Martial God of Wealth",
      "Saint of War"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Lord Guan (關公)",
      "Emperor Guan (關帝)",
      "Martial God of Wealth",
      "Saint of War",
      "War",
      "righteousness",
      "loyalty",
      "brotherhood",
      "justice",
      "commerce",
      "protection"
    ],
    "attributes": [],
    "symbols": [
      "Green Dragon Crescent Blade (guandao)",
      "red face",
      "long beard",
      "Confucian texts",
      "Red Hare horse (赤兔馬)",
      "dragon (imperial association)",
      "Peach blossoms (brotherhood oath)",
      "bamboo (uprightness)"
    ]
  },
  "name": "Guan Yu",
  "primarySources": [
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Long",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=long"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Jade Emperor",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade%20emperor"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Three",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=three"
    },
    {
      "term": "Traditions",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=traditions"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Three",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=three"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Gong",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Long",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=long"
    },
    {
      "term": "Long",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=long"
    },
    {
      "term": "Dragon",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=dragon"
    },
    {
      "term": "Three",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=three"
    },
    {
      "term": "Elements",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=elements"
    },
    {
      "term": "Goddess of Mercy",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Celestial Bureaucracy",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial%20bureaucracy"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Journey",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=journey"
    },
    {
      "term": "Other",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=other"
    },
    {
      "term": "Sun Wukong",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sun_wukong"
    },
    {
      "term": "Nezha",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=nezha"
    },
    {
      "term": "Eight Immortals",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=ba_xian"
    },
    {
      "term": "Qilin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=qilin"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Yin-Yang",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=yin_yang"
    },
    {
      "term": "Elements",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=elements"
    },
    {
      "term": "Journey",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=journey"
    },
    {
      "term": "Tao",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tao"
    },
    {
      "term": "Traditions",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=traditions"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan%20yu"
    },
    {
      "term": "Guan Yu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guan_yu"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "guan-yu",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Afterlife",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "deity",
      "name": "Ares",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "Mars",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "Týr",
      "link": "../../norse/deities/tyr.html"
    },
    {
      "type": "deity",
      "name": "Kartikeya",
      "link": "../../hindu/deities/kartikeya.html"
    },
    {
      "type": "deity",
      "name": "Montu",
      "link": "../../egyptian/deities/montu.html"
    },
    {
      "type": "deity",
      "name": "🏛️\nAres\nGreek",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "🏛️\nMars\nRoman",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "⚔️\nTyr\nNorse",
      "link": "../../norse/deities/tyr.html"
    },
    {
      "type": "deity",
      "name": "🕉️\nKartikeya\nHindu",
      "link": "../../hindu/deities/kartikeya.html"
    },
    {
      "type": "deity",
      "name": "☀️\nMontu\nEgyptian",
      "link": "../../egyptian/deities/montu.html"
    },
    {
      "type": "deity",
      "name": "🏛️ Mars (Roman)",
      "link": "../../roman/deities/mars.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: guanyin</summary>

```json
{
  "epithets": [],
  "displayName": "🙏 Guanyin",
  "description": "观音 / 観音 (Guān Yīn) - Goddess of Compassion and Mercy",
  "domains": [],
  "title": "Chinese - Guanyin",
  "symbols": [],
  "mythology": "chinese",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Guanyin",
  "primarySources": [
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Kuan Yin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Avalokiteshvara",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Corpus",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=corpus"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Related Concepts",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Buddhist",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=buddhist"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Related Concepts",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Chinese Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=within%20chinese%20mythology"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Buddhist",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=buddhist"
    },
    {
      "term": "Buddhist",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=buddhist"
    },
    {
      "term": "Buddhist",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=buddhist"
    },
    {
      "term": "Guanyin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "guanyin",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "☸️\nAvalokiteshvara\nBuddhist",
      "link": "../../buddhist/deities/avalokiteshvara.html"
    },
    {
      "type": "deity",
      "name": "☀️\nIsis\nEgyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "cosmology",
      "name": "💀 Afterlife & Reincarnation",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "deity",
      "name": "☸️ Avalokiteshvara",
      "link": "../../buddhist/deities/avalokiteshvara.html"
    },
    {
      "type": "cosmology",
      "name": "Afterlife",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "deity",
      "name": "Avalokiteshvara",
      "link": "../../buddhist/deities/avalokiteshvara.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: jade-emperor</summary>

```json
{
  "epithets": [],
  "displayName": "Jade Emperor",
  "description": "The Jade Emperor is the supreme ruler of heaven and earth in Chinese mythology, presiding over the celestial bureaucracy as the divine emperor who governs all gods, spirits, and mortal affairs. He embodies the Confucian ideal of the perfect sovereign: wise, just, compassionate, and absolute in authority.",
  "domains": [],
  "title": "Chinese - Jade Emperor",
  "symbols": [
    "Tea and wine: Symbolizing respect and hospitality"
  ],
  "mythology": "chinese",
  "relationships": {
    "mother": "of the west (西王母)",
    "children": [
      "seven daughters (the seven fairies",
      "七仙女)",
      "not lineage"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "of the west (西王母)",
      "children": [
        "seven daughters (the seven fairies",
        "七仙女)",
        "not lineage"
      ]
    },
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": [
      "Tea and wine: Symbolizing respect and hospitality"
    ]
  },
  "name": "Jade Emperor",
  "primarySources": [
    {
      "term": "Jade Emperor",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade%20emperor"
    },
    {
      "term": "Jade Emperor",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade%20emperor"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "August Personage of Jade",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade_emperor"
    },
    {
      "term": "Heavenly Grandfather",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade_emperor"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Immortality",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=immortality"
    },
    {
      "term": "Yellow",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=yellow"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Monkey King",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sun_wukong"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Immortality",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=immortality"
    },
    {
      "term": "Celestial Order",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Jade Emperor",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade%20emperor"
    },
    {
      "term": "Traditions",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=traditions"
    },
    {
      "term": "Queen Mother of the West",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=xi_wangmu"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    },
    {
      "term": "Three",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=three"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Monkey King",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sun_wukong"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Worship",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sacred"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Chinese",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=chinese"
    },
    {
      "term": "Celestial",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial"
    },
    {
      "term": "Long",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=long"
    },
    {
      "term": "Heavenly Grandfather",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade_emperor"
    },
    {
      "term": "Celestial Bureaucracy",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=celestial%20bureaucracy"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Bureaucracy",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=bureaucracy"
    },
    {
      "term": "Corpus",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=corpus"
    },
    {
      "term": "Related Concepts",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Related Concepts",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Chinese Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=within%20chinese%20mythology"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Goddess of Mercy",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=guanyin"
    },
    {
      "term": "Heaven",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Pangu",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=pangu"
    },
    {
      "term": "Sun Wukong",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=sun_wukong"
    },
    {
      "term": "Eight Immortals",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=ba_xian"
    },
    {
      "term": "Nezha",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=nezha"
    },
    {
      "term": "Qilin",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=qilin"
    },
    {
      "term": "Deities",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=deities"
    },
    {
      "term": "Yin-Yang",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=yin_yang"
    },
    {
      "term": "Elements",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=elements"
    },
    {
      "term": "The Way",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tao"
    },
    {
      "term": "Traditions",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=traditions"
    },
    {
      "term": "Sky",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Supreme Deity",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=tian"
    },
    {
      "term": "Jade Emperor",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=jade%20emperor"
    },
    {
      "term": "Mythology",
      "tradition": "chinese",
      "href": "../../../mythos/chinese/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "jade-emperor",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\nZeus\nGreek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "⚔️\nOdin\nNorse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🕉️\nIndra\nHindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "🏛️\nJupiter\nRoman",
      "link": "../../roman/deities/jupiter.html"
    },
    {
      "type": "deity",
      "name": "☀️\nRa\nEgyptian",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "🎌\nAmaterasu\nJapanese",
      "link": "../../japanese/deities/amaterasu.html"
    },
    {
      "type": "cosmology",
      "name": "Afterlife",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "cosmology",
      "name": "Creation Myth",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "Zeus",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "Odin",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "Brahma",
      "link": "../../hindu/deities/brahma.html"
    },
    {
      "type": "deity",
      "name": "Ra",
      "link": "../../egyptian/deities/ra.html"
    }
  ]
}
```

</details>

---

### `christian` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: gabriel</summary>

```json
{
  "epithets": [
    "\"God is my strength\" or \"Mighty one of God\" (Hebrew: גַּבְרִיאֵל)"
  ],
  "displayName": "📯 Archangel Gabriel",
  "description": "Divine Messenger, Herald of God",
  "domains": [
    "\"God is my strength\" or \"Mighty one of God\" (Hebrew: גַּבְרִיאֵל)",
    "Chief messenger of God",
    "Herald of divine revelations",
    "Announcer of the Incarnation",
    "Divine communication",
    "Prophecy",
    "Revelation",
    "Annunciation"
  ],
  "title": "Christian - Gabriel",
  "symbols": [
    "Trumpet",
    "Lily (purity)",
    "Scroll",
    "Lantern",
    "Malachim (Angels) - Hebrew messenger tradition",
    "Aeons - Divine emanations as revealers",
    "Pleroma - Heavenly realm of divine fullness",
    "Sophia - Divine wisdom and revelation",
    "Gnostic Revelation - Hidden knowledge traditions",
    "Hermes (Greek) - Divine messenger archetype",
    "Thoth (Egyptian) - Messenger and scribe of gods",
    "Heimdall (Norse) - Herald and watchman"
  ],
  "mythology": "christian",
  "relationships": {
    "father": "of john the baptist"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "father": "of john the baptist"
    },
    "epithets": [
      "\"God is my strength\" or \"Mighty one of God\" (Hebrew: גַּבְרִיאֵל)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "\"God is my strength\" or \"Mighty one of God\" (Hebrew: גַּבְרִיאֵל)",
      "Chief messenger of God",
      "Herald of divine revelations",
      "Announcer of the Incarnation",
      "Divine communication",
      "Prophecy",
      "Revelation",
      "Annunciation"
    ],
    "attributes": [],
    "symbols": [
      "Trumpet",
      "Lily (purity)",
      "Scroll",
      "Lantern",
      "Malachim (Angels) - Hebrew messenger tradition",
      "Aeons - Divine emanations as revealers",
      "Pleroma - Heavenly realm of divine fullness",
      "Sophia - Divine wisdom and revelation",
      "Gnostic Revelation - Hidden knowledge traditions",
      "Hermes (Greek) - Divine messenger archetype",
      "Thoth (Egyptian) - Messenger and scribe of gods",
      "Heimdall (Norse) - Herald and watchman"
    ]
  },
  "name": "Gabriel",
  "primarySources": [
    {
      "term": "Archangel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "salvation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messiah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Michael",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Raphael",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Biblical",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Anointed One",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messiah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "theological significance",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "birth",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christian",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Theological Significance",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "salvation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christian tradition",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Archangel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Archangel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptist",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of Man",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Israel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Anointed One",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prince",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "birth",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "David",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "David",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jacob",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Servant of the Lord",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christian",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sources",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Enoch",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Michael",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Uriel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Raphael",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Enoch",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Enoch",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Michael",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Raphael",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Enoch",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Archangel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    }
  ],
  "attributes": [],
  "id": "gabriel",
  "relatedEntities": [
    {
      "type": "hero",
      "name": "Daniel",
      "link": "../heroes/daniel.html"
    },
    {
      "type": "cosmology",
      "name": "salvation",
      "link": "../cosmology/salvation.html"
    },
    {
      "type": "hero",
      "name": "Daniel",
      "link": "../heroes/daniel.html"
    },
    {
      "type": "deity",
      "name": "Hermes",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "Heimdall",
      "link": "../../norse/deities/heimdall.html"
    },
    {
      "type": "deity",
      "name": "Thoth",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "Hermes",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "Thoth",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "Heimdall",
      "link": "../../norse/deities/heimdall.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: god-father</summary>

```json
{
  "epithets": [
    "Ancient of Days",
    "Almighty",
    "Most High",
    "Abba (Father)",
    "Lord of Hosts",
    "YHWH",
    "Elohim",
    "El Shaddai",
    "Adonai",
    "Jehovah"
  ],
  "displayName": "🔵 God the Father",
  "description": "The First Person of the Holy Trinity",
  "domains": [
    "Ancient of Days",
    "Almighty",
    "Most High",
    "Abba (Father)",
    "Lord of Hosts",
    "Creation",
    "Providence",
    "Authority",
    "Sovereignty",
    "Justice",
    "Mercy"
  ],
  "title": "Christian - God Father",
  "symbols": [
    "Throne",
    "Crown",
    "All-Seeing Eye",
    "Hand from Clouds",
    "Triangle",
    "One (Unity)",
    "Three (Trinity)",
    "Seven (Perfection)",
    "YHWH",
    "Elohim",
    "El Shaddai",
    "Adonai",
    "Jehovah",
    "YHWH - The same God in Jewish tradition",
    "Ein Sof - The infinite in Kabbalah",
    "God of Abraham - Covenant relationship",
    "Divine Presence - God's immanence",
    "True Father - Gnostic transcendent deity",
    "Father & Sophia - Divine emanations",
    "Pleroma - The divine fullness",
    "Allah - Abrahamic monotheism",
    "Zeus - Sky Father archetype",
    "Brahman - Ultimate reality",
    "Sky Father Archetype - Creator deity pattern"
  ],
  "mythology": "christian",
  "relationships": {
    "father": "in classical trinitarian theology"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "father": "in classical trinitarian theology"
    },
    "epithets": [
      "Ancient of Days",
      "Almighty",
      "Most High",
      "Abba (Father)",
      "Lord of Hosts",
      "YHWH",
      "Elohim",
      "El Shaddai",
      "Adonai",
      "Jehovah"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Ancient of Days",
      "Almighty",
      "Most High",
      "Abba (Father)",
      "Lord of Hosts",
      "Creation",
      "Providence",
      "Authority",
      "Sovereignty",
      "Justice",
      "Mercy"
    ],
    "attributes": [],
    "symbols": [
      "Throne",
      "Crown",
      "All-Seeing Eye",
      "Hand from Clouds",
      "Triangle",
      "One (Unity)",
      "Three (Trinity)",
      "Seven (Perfection)",
      "YHWH",
      "Elohim",
      "El Shaddai",
      "Adonai",
      "Jehovah",
      "YHWH - The same God in Jewish tradition",
      "Ein Sof - The infinite in Kabbalah",
      "God of Abraham - Covenant relationship",
      "Divine Presence - God's immanence",
      "True Father - Gnostic transcendent deity",
      "Father & Sophia - Divine emanations",
      "Pleroma - The divine fullness",
      "Allah - Abrahamic monotheism",
      "Zeus - Sky Father archetype",
      "Brahman - Ultimate reality",
      "Sky Father Archetype - Creator deity pattern"
    ]
  },
  "name": "God Father",
  "primarySources": [
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "YHWH",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sovereign",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Almighty",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Abba",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "YHWH",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "relationship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Biblical",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Abraham",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Abraham",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaac",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Deliverance",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Israel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Moses",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mount Sinai",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "relationship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Israel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Solomon",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jeremiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messiah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Redemption",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptism",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Crucifixion",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Redemption",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Church",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Relationship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Godhead",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "salvation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Redemption",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Almighty",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    }
  ],
  "attributes": [],
  "id": "god-father",
  "relatedEntities": [
    {
      "type": "hero",
      "name": "God of Abraham",
      "link": "../../jewish/heroes/abraham.html"
    },
    {
      "type": "deity",
      "name": "Allah",
      "link": "../../islamic/deities/allah.html"
    },
    {
      "type": "deity",
      "name": "Zeus",
      "link": "../../greek/deities/zeus.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: holy-spirit</summary>

```json
{
  "epithets": [
    "Comforter",
    "Advocate",
    "Paraclete",
    "Spirit of Truth",
    "Spirit of God",
    "Breath of Life"
  ],
  "displayName": "🔥 The Holy Spirit",
  "description": "The Third Person of the Holy Trinity",
  "domains": [
    "Comforter",
    "Advocate",
    "Paraclete",
    "Spirit of Truth",
    "Spirit of God",
    "Breath of Life",
    "Inspiration",
    "Transformation",
    "Gifts",
    "Guidance",
    "Conviction",
    "Sanctification"
  ],
  "title": "The",
  "symbols": [
    "Dove",
    "Flame",
    "Wind",
    "Water",
    "Oil",
    "Breath",
    "Tongues of fire",
    "Rushing wind",
    "Descending dove",
    "Living water",
    "Anointing oil",
    "Seven (seven gifts",
    "seven spirits before throne)",
    "Ruach HaKodesh - Holy Spirit in Judaism",
    "Shekinah - Divine presence",
    "Chokmah - Divine Wisdom personified",
    "Prophetic Spirit - Spirit inspiring prophets",
    "Sophia - Divine Wisdom/Spirit parallel",
    "Divine Emanations - Spirit as divine power",
    "Spirit Baptism - Gnostic initiations",
    "Prana - Hindu divine breath/energy",
    "Qi/Chi - Life force in Chinese thought",
    "Spenta Mainyu - Zoroastrian holy spirit",
    "Divine Breath - Universal spirit concept"
  ],
  "mythology": "christian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Comforter",
      "Advocate",
      "Paraclete",
      "Spirit of Truth",
      "Spirit of God",
      "Breath of Life"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Comforter",
      "Advocate",
      "Paraclete",
      "Spirit of Truth",
      "Spirit of God",
      "Breath of Life",
      "Inspiration",
      "Transformation",
      "Gifts",
      "Guidance",
      "Conviction",
      "Sanctification"
    ],
    "attributes": [],
    "symbols": [
      "Dove",
      "Flame",
      "Wind",
      "Water",
      "Oil",
      "Breath",
      "Tongues of fire",
      "Rushing wind",
      "Descending dove",
      "Living water",
      "Anointing oil",
      "Seven (seven gifts",
      "seven spirits before throne)",
      "Ruach HaKodesh - Holy Spirit in Judaism",
      "Shekinah - Divine presence",
      "Chokmah - Divine Wisdom personified",
      "Prophetic Spirit - Spirit inspiring prophets",
      "Sophia - Divine Wisdom/Spirit parallel",
      "Divine Emanations - Spirit as divine power",
      "Spirit Baptism - Gnostic initiations",
      "Prana - Hindu divine breath/energy",
      "Qi/Chi - Life force in Chinese thought",
      "Spenta Mainyu - Zoroastrian holy spirit",
      "Divine Breath - Universal spirit concept"
    ]
  },
  "name": "The",
  "primarySources": [
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine Presence",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Comforter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Paraclete",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit of Truth",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Comforter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Paraclete",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sanctification",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Tongues of Fire",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Biblical",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ezekiel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Saul",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "David",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Dry Bones",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ezekiel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptism",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Tongues of Fire",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Church",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Peter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Satan",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Paul",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ezekiel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Salvation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Born Again",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sanctification",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Church",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Church",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "worship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trust",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "sources",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Faithfulness",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "relationship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Triune God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "grace",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Pentecost",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Tongues of Fire",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptism",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    }
  ],
  "attributes": [],
  "id": "holy-spirit",
  "relatedEntities": []
}
```

</details>

<details>
<summary>Document 4: jesus-christ</summary>

```json
{
  "epithets": [
    "Christ",
    "Messiah",
    "Son of God",
    "Son of Man",
    "Lamb of God",
    "Good Shepherd",
    "Light of the World"
  ],
  "displayName": "🕊️ Jesus Christ",
  "description": "The Second Person of the Holy Trinity - God Incarnate",
  "domains": [
    "Christ",
    "Messiah",
    "Son of God",
    "Son of Man",
    "Lamb of God",
    "Good Shepherd",
    "Light of the World",
    "Redemption",
    "Salvation",
    "Love",
    "Sacrifice",
    "Healing",
    "Teaching",
    "Resurrection",
    "Reveals God's will",
    "teaches truth",
    "proclaims Kingdom",
    "fulfills Old Testament prophecies"
  ],
  "title": "Christian - Jesus Christ",
  "symbols": [
    "Cross",
    "Lamb",
    "Fish (Ichthys)",
    "Sacred Heart",
    "Alpha & Omega",
    "Chi-Rho",
    "Lamb (sacrifice)",
    "Dove (baptism)",
    "Lion (kingship)",
    "Fish (followers)",
    "Grape vine (true vine)",
    "Lily (purity)",
    "Olive (peace)",
    "Crown of thorns",
    "Logos in Judaism - Jewish Wisdom traditions",
    "Passover Lamb - Sacrificial typology",
    "Moses - Typological predecessor",
    "Gnostic Christ - Christ as revealer of gnosis",
    "Secret Teachings - Esoteric Jesus traditions",
    "Gospel of Thomas - Alternative Jesus sayings",
    "Christ & Sophia - Wisdom Christology",
    "Osiris - Egyptian death and resurrection",
    "Krishna - Hindu divine incarnation",
    "Isa in Islam - Jesus honored in Islam"
  ],
  "mythology": "christian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Christ",
      "Messiah",
      "Son of God",
      "Son of Man",
      "Lamb of God",
      "Good Shepherd",
      "Light of the World"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Christ",
      "Messiah",
      "Son of God",
      "Son of Man",
      "Lamb of God",
      "Good Shepherd",
      "Light of the World",
      "Redemption",
      "Salvation",
      "Love",
      "Sacrifice",
      "Healing",
      "Teaching",
      "Resurrection",
      "Reveals God's will",
      "teaches truth",
      "proclaims Kingdom",
      "fulfills Old Testament prophecies"
    ],
    "attributes": [],
    "symbols": [
      "Cross",
      "Lamb",
      "Fish (Ichthys)",
      "Sacred Heart",
      "Alpha & Omega",
      "Chi-Rho",
      "Lamb (sacrifice)",
      "Dove (baptism)",
      "Lion (kingship)",
      "Fish (followers)",
      "Grape vine (true vine)",
      "Lily (purity)",
      "Olive (peace)",
      "Crown of thorns",
      "Logos in Judaism - Jewish Wisdom traditions",
      "Passover Lamb - Sacrificial typology",
      "Moses - Typological predecessor",
      "Gnostic Christ - Christ as revealer of gnosis",
      "Secret Teachings - Esoteric Jesus traditions",
      "Gospel of Thomas - Alternative Jesus sayings",
      "Christ & Sophia - Wisdom Christology",
      "Osiris - Egyptian death and resurrection",
      "Krishna - Hindu divine incarnation",
      "Isa in Islam - Jesus honored in Islam"
    ]
  },
  "name": "Jesus Christ",
  "primarySources": [
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Logos",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Third Day",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messiah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of Man",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lamb",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Good Shepherd",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Light of the World",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Redemption",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Salvation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lamb",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lamb",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptism",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Logos",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Hypostatic Union",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Divine",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Abraham",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "birth",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Early",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Birth",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "angels",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Baptism",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Satan",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Nature",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Moses",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Elijah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Passion",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Death",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Last Supper",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Covenant",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Peter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Crucifixion",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Seven Last Words",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Good Friday",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Empty Tomb",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Third Day",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "angels",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Magdalene",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mount of Olives",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Exaltation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Paul",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Church",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Atonement",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "theological",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ransom",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ransom",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Satan",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Penal Substitution",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Good Friday",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Crucifixion",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Easter",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Eucharist",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Communion",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Passion",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    }
  ],
  "attributes": [],
  "id": "jesus-christ",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Dionysus",
      "link": "../../greek/deities/dionysus.html"
    },
    {
      "type": "deity",
      "name": "Osiris",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "Krishna",
      "link": "../../hindu/deities/krishna.html"
    },
    {
      "type": "hero",
      "name": "Moses",
      "link": "../heroes/moses.html"
    },
    {
      "type": "deity",
      "name": "Osiris",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "Krishna",
      "link": "../../hindu/deities/krishna.html"
    },
    {
      "type": "hero",
      "name": "Isa in Islam",
      "link": "../../islamic/heroes/isa.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: jesus_christ</summary>

```json
{
  "epithets": [],
  "displayName": "Jesus Christ (Yeshua Ha-Mashiach)",
  "description": "",
  "domains": [],
  "title": "Christian - Jesus Christ",
  "symbols": [
    "Mashiach - Jewish Messianic expectations",
    "Moses - Liberator and lawgiver prefiguration",
    "Memra - Aramaic concept of divine Word",
    "Sophia - Christ as wisdom incarnate",
    "Pleroma - Descent from divine fullness",
    "Gospel of Thomas - Alternative sayings traditions",
    "Osiris (Egyptian) - Dying and rising god",
    "Dionysus (Greek) - Divine son, death and rebirth",
    "Krishna (Hindu) - Divine incarnation (Avatar)",
    "Saoshyant (Persian) - World savior archetype"
  ],
  "mythology": "christian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": [
      "Mashiach - Jewish Messianic expectations",
      "Moses - Liberator and lawgiver prefiguration",
      "Memra - Aramaic concept of divine Word",
      "Sophia - Christ as wisdom incarnate",
      "Pleroma - Descent from divine fullness",
      "Gospel of Thomas - Alternative sayings traditions",
      "Osiris (Egyptian) - Dying and rising god",
      "Dionysus (Greek) - Divine son, death and rebirth",
      "Krishna (Hindu) - Divine incarnation (Avatar)",
      "Saoshyant (Persian) - World savior archetype"
    ]
  },
  "name": "Jesus Christ",
  "primarySources": [
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mashiach",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Messiah",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of Man",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Son of God",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Emmanuel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Logos",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lamb",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King of Kings",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lord of Lords",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Savior",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Nature and Role",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christian",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "death",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Reconciliation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Early",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Archangel",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Emmanuel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Passion",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "death",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Third Day",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "God the Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Theological Significance",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Sacrifice",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Relationship to Other Figures",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Apostle to the Gentiles",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Beloved Disciple",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Incarnation",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "David",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Joseph",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "David",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Grace",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Father",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Crucifixion",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Hour",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Hour",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Hour",
      "tradition": "islamic",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "spirit",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "John",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Third Day",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cephas",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Isaiah",
      "tradition": "jewish",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Primary",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Christ",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Cross",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "creation",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Death",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "heaven",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "King of Kings",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Lord of Lords",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Testament",
      "tradition": null,
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Resurrection",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Logos",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    },
    {
      "term": "Trinity",
      "tradition": "christian",
      "href": "../../babylonian/corpus-search.html"
    }
  ],
  "attributes": [],
  "id": "jesus_christ",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Son of God",
      "link": "../cosmology/trinity.html"
    },
    {
      "type": "cosmology",
      "name": "Holy Trinity",
      "link": "../cosmology/trinity.html"
    },
    {
      "type": "cosmology",
      "name": "resurrection",
      "link": "../cosmology/resurrection.html"
    },
    {
      "type": "cosmology",
      "name": "salvation",
      "link": "../cosmology/salvation.html"
    },
    {
      "type": "hero",
      "name": "Peter",
      "link": "../heroes/peter.html"
    },
    {
      "type": "hero",
      "name": "John",
      "link": "../heroes/john.html"
    },
    {
      "type": "cosmology",
      "name": "Easter Sunday",
      "link": "../cosmology/resurrection.html"
    },
    {
      "type": "cosmology",
      "name": "Heaven",
      "link": "../cosmology/heaven.html"
    },
    {
      "type": "deity",
      "name": "sin",
      "link": "../../babylonian/deities/sin.html"
    },
    {
      "type": "cosmology",
      "name": "grace",
      "link": "../cosmology/grace.html"
    },
    {
      "type": "cosmology",
      "name": "God the Father",
      "link": "../cosmology/trinity.html"
    },
    {
      "type": "cosmology",
      "name": "Holy Spirit",
      "link": "../cosmology/trinity.html"
    },
    {
      "type": "hero",
      "name": "Saint Peter",
      "link": "../heroes/peter.html"
    },
    {
      "type": "hero",
      "name": "Saint John",
      "link": "../heroes/john.html"
    },
    {
      "type": "hero",
      "name": "Moses",
      "link": "../heroes/moses.html"
    },
    {
      "type": "hero",
      "name": "Moses",
      "link": "../../jewish/heroes/moses.html"
    },
    {
      "type": "deity",
      "name": "Osiris",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "Dionysus",
      "link": "../../greek/deities/dionysus.html"
    },
    {
      "type": "deity",
      "name": "Krishna",
      "link": "../../hindu/deities/krishna.html"
    }
  ]
}
```

</details>

---

### `concepts` Schema

#### Schema Variation 1

**Fields:**
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `participants` (array)
- `primarySources` (array)
- `relatedConcepts` (array)
- `significance` (array)
- `type` (string)

**Sample Documents:**

<details>
<summary>Document 1: buddhist_bodhisattva</summary>

```json
{
  "significance": [],
  "metadata": {
    "createdAt": "2025-12-13T02:52:29.323Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/concepts/bodhisattva.html",
    "updatedAt": "2025-12-13T02:52:29.323Z"
  },
  "filename": "bodhisattva",
  "displayName": "🙏 Bodhisattva",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "An enlightened being who delays entry into final nirvana in order to help all sentient beings achieve liberation. The bodhisattva ideal is central to Mahayana Buddhism. Major bodhisattvas include Avalokiteshvara (compassion) and Manjushri (wisdom).",
  "relatedConcepts": [],
  "id": "buddhist_bodhisattva",
  "type": "concept",
  "mythology": "buddhist",
  "participants": []
}
```

</details>

<details>
<summary>Document 2: buddhist_compassion</summary>

```json
{
  "significance": [],
  "metadata": {
    "createdAt": "2025-12-13T02:52:29.335Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/concepts/compassion.html",
    "updatedAt": "2025-12-13T02:52:29.335Z"
  },
  "filename": "compassion",
  "displayName": "💗 Compassion (Karuna)",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "One of the central virtues in Buddhism, the wish for all beings to be free from suffering. Combined with wisdom, compassion is the foundation of the bodhisattva path and is personified by Avalokiteshvara.",
  "relatedConcepts": [],
  "id": "buddhist_compassion",
  "type": "concept",
  "mythology": "buddhist",
  "participants": []
}
```

</details>

<details>
<summary>Document 3: christian_demiurge-vs-monad</summary>

```json
{
  "significance": [],
  "metadata": {
    "createdAt": "2025-12-13T02:52:29.425Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/gnostic/concepts/demiurge-vs-monad.html",
    "updatedAt": "2025-12-13T02:52:29.425Z"
  },
  "filename": "demiurge-vs-monad",
  "displayName": "Demiurge vs. Monad",
  "name": "The False God and the True Father in Gnostic Christianity",
  "primarySources": [],
  "description": "The most revolutionary claim of Gnostic Christianity: the god of the Old Testament - the creator of the material world,\n                the lawgiver of Sinai, the jealous deity demanding worship - is not the supreme God. That is\n                Yaldabaoth, the Demiurge, the ignorant craftsman born from\n                Sophia's defective emanation. Above him, beyond all the archontic spheres,\n                dwelling in ineffable light and perfect silence, is the Monad - the true Father revealed by\n                Christ. This is the distinction between the god of this world and the\n                God of eternity, between the ruler of matter and the source of spirit, between law and grace, judgment and love,\n                fear and gnosis. Understanding this difference is the key to spiritual liberation.",
  "relatedConcepts": [
    "Yaldabaoth - The Demiurge in Detail",
    "Gnostic Cosmology - The Monad and the Pleroma",
    "Sabaoth - The Repentant Archon Who Recognized the Father",
    "The Archons - Servants of the Demiurge",
    "Sophia - Divine Wisdom and Mother of the Demiurge",
    "Christ the Redeemer - Revealer of the Unknown Father",
    "Universal Salvation - Even the Demiurge Will Be Redeemed"
  ],
  "id": "christian_demiurge-vs-monad",
  "type": "concept",
  "mythology": "christian",
  "participants": [
    "Perfect Love: \"God is love\" (1 John 4:8) - no wrath, no violence, no vengeance",
    "Universal Compassion: \"Makes his sun rise on the evil and on the good\" (Matthew 5:45)",
    "Forgiving: Forgives without sacrifice - \"Neither do I condemn you\" (John 8:11)",
    "Non-Judgmental: \"For God did not send his Son into the world to condemn the world\" (John 3:17)",
    "Merciful: \"Be merciful, even as your Father is merciful\" (Luke 6:36)",
    "Perfect: \"Be perfect, as your heavenly Father is perfect\" (Matthew 5:48)"
  ]
}
```

</details>

<details>
<summary>Document 4: egyptian_maat</summary>

```json
{
  "significance": [
    "Natural Law: Ethics grounded in cosmic order rather than arbitrary divine command",
    "Social Contract: Individual ethics connected to cosmic maintenance",
    "Merit-Based Afterlife: Judgment based on moral worth, not wealth or status",
    "Universal Principles: Truth and justice as absolute standards applying to all",
    "Cosmic Interdependence: Human actions affect divine realm and vice versa"
  ],
  "metadata": {
    "createdAt": "2025-12-13T02:52:29.313Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/egyptian/concepts/maat.html",
    "updatedAt": "2025-12-13T02:52:29.313Z"
  },
  "filename": "maat",
  "displayName": "⚖️ Ma'at (Concept)",
  "name": "Egyptian Mythology",
  "primarySources": [],
  "description": "",
  "relatedConcepts": [
    "Dike - Greek goddess of justice and moral order",
    "Dharma - Hindu cosmic law and moral order",
    "Asha - Zoroastrian truth and righteousness",
    "Me - Sumerian divine decrees of civilization",
    "Cosmic Order - Universal balance",
    "Divine Justice - Judgment of souls",
    "Sacred Duality - Order versus chaos",
    "Ma'at (Goddess) - Personification of cosmic order",
    "The Afterlife - Judgment of the heart",
    "Osiris - Judge of the dead",
    "Thoth - Recorder of judgment",
    "The Amduat - Journey through judgment"
  ],
  "id": "egyptian_maat",
  "type": "concept",
  "mythology": "egyptian",
  "participants": []
}
```

</details>

<details>
<summary>Document 5: greek_judgment-of-paris</summary>

```json
{
  "significance": [],
  "metadata": {
    "createdAt": "2025-12-13T02:52:39.486Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/greek/myths/judgment-of-paris.html",
    "updatedAt": "2025-12-13T02:52:39.486Z"
  },
  "filename": "judgment-of-paris",
  "displayName": "🍎 The Judgment of Paris",
  "name": "Greek Mythology",
  "primarySources": [],
  "description": "The Judgment of Paris\nis one of Greek mythology's most consequential tales - a beauty contest among three goddesses that ignited the Trojan War.\nWhen Paris, prince of Troy, was forced to judge who was fairest among Hera,\nAthena, and Aphrodite,\nhis choice set in motion a decade-long war that destroyed civilizations and birthed epic poetry.",
  "relatedConcepts": [
    "Aphrodite - Winner of the judgment",
    "Hera - Queen of the gods, scorned",
    "Athena - Goddess of wisdom, rejected",
    "Zeus - Refused to judge",
    "Hermes - Messenger to Paris",
    "Greek Myths - Other mythological tales",
    "Achilles - Son of Thetis and Peleus",
    "Greek Deities - The Olympian pantheon",
    "Greek Cosmology - Mythological worldview"
  ],
  "id": "greek_judgment-of-paris",
  "type": "concept",
  "mythology": "greek",
  "participants": [
    "Aphrodite - Winner of the judgment",
    "Hera - Queen of the gods, scorned",
    "Athena - Goddess of wisdom, rejected",
    "Zeus - Refused to judge",
    "Hermes - Messenger to Paris"
  ]
}
```

</details>

---

### `cosmology` Schema

#### Schema Variation 1

**Fields:**
- `connections` (array)
- `description` (string)
- `displayName` (string)
- `features` (array)
- `filename` (string)
- `id` (string)
- `inhabitants` (array)
- `layers` (array)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `type` (string)

**Sample Documents:**

<details>
<summary>Document 1: babylonian_afterlife</summary>

```json
{
  "inhabitants": [],
  "metadata": {
    "createdAt": "2025-12-13T02:38:07.640Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/cosmology/afterlife.html",
    "updatedAt": "2025-12-13T02:38:07.640Z"
  },
  "displayName": "⚰️ Babylonian Afterlife",
  "description": "The Babylonian underworld was a dark, dreary realm beneath the earth where all the dead dwelled\n                regardless of their deeds in life. A place of dust and darkness, ruled by the fearsome goddess\n                Ereshkigal and her consort Nergal, from which no mortal could return. Here the dead existed as\n                shadowy echoes, stripped of vitality, clothed in feathers like birds, eating dust and clay.",
  "type": "concept",
  "mythology": "babylonian",
  "features": [],
  "filename": "afterlife",
  "layers": [],
  "name": "The",
  "primarySources": [],
  "id": "babylonian_afterlife",
  "connections": []
}
```

</details>

<details>
<summary>Document 2: babylonian_apsu</summary>

```json
{
  "inhabitants": [],
  "metadata": {
    "createdAt": "2025-12-13T02:38:07.662Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/cosmology/apsu.html",
    "updatedAt": "2025-12-13T02:38:07.662Z"
  },
  "displayName": "💧 Apsu",
  "description": "",
  "type": "realm",
  "mythology": "babylonian",
  "features": [],
  "filename": "apsu",
  "layers": [],
  "name": "Apsu",
  "primarySources": [],
  "id": "babylonian_apsu",
  "connections": []
}
```

</details>

<details>
<summary>Document 3: babylonian_creation</summary>

```json
{
  "inhabitants": [],
  "metadata": {
    "createdAt": "2025-12-13T02:38:07.678Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/cosmology/creation.html",
    "updatedAt": "2025-12-13T02:38:07.678Z"
  },
  "displayName": "🌊 Babylonian Creation Myth",
  "description": "The Babylonian creation epic describes how the ordered cosmos emerged from primordial waters through\n                divine conflict. Young Marduk defeated the chaos dragon Tiamat, creating heaven and earth from her\n                corpse and humanity from her consort's blood. This mythic battle established Marduk's kingship and\n                the eternal principle: order must be violently wrested from chaos and constantly defended.",
  "type": "concept",
  "mythology": "babylonian",
  "features": [],
  "filename": "creation",
  "layers": [],
  "name": "",
  "primarySources": [],
  "id": "babylonian_creation",
  "connections": []
}
```

</details>

<details>
<summary>Document 4: buddhist_afterlife</summary>

```json
{
  "inhabitants": [],
  "metadata": {
    "createdAt": "2025-12-13T02:38:07.419Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/cosmology/afterlife.html",
    "updatedAt": "2025-12-13T02:38:07.419Z"
  },
  "displayName": "💀 Buddhist Afterlife - Bardo, Rebirth & Nirvana",
  "description": "In Buddhism, death is not an ending but a transition. The consciousness exits the dying body and\n                enters the bardo—an intermediate state between lives—where it experiences visions based on karma.\n                After up to 49 days, the consciousness is drawn to rebirth in one of six realms according to its\n                accumulated karma. Only nirvana offers true liberation from this endless cycle.",
  "type": "concept",
  "mythology": "buddhist",
  "features": [],
  "filename": "afterlife",
  "layers": [],
  "name": "Bardo, Rebirth & Nirvana\"",
  "primarySources": [],
  "id": "buddhist_afterlife",
  "connections": []
}
```

</details>

<details>
<summary>Document 5: buddhist_creation</summary>

```json
{
  "inhabitants": [],
  "metadata": {
    "createdAt": "2025-12-13T02:38:07.433Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/cosmology/creation.html",
    "updatedAt": "2025-12-13T02:38:07.433Z"
  },
  "displayName": "🌀 Buddhist Creation - Interdependent Origination",
  "description": "Buddhism uniquely teaches that there is no creation by a supreme deity. Instead, all phenomena arise\n                dependently through an endless chain of causes and conditions. Nothing possesses inherent,\n                independent existence. This teaching of Pratityasamutpada (Interdependent Origination) explains\n                both the arising of the universe and the perpetuation of suffering in the cycle of rebirth.",
  "type": "concept",
  "mythology": "buddhist",
  "features": [],
  "filename": "creation",
  "layers": [],
  "name": "Interdependent Origination",
  "primarySources": [],
  "id": "buddhist_creation",
  "connections": [
    "Rebirth & Liberation - Where dependent origination leads",
    "Buddhist Cosmology - The structure of cyclical existence",
    "The Buddha - Who discovered this truth",
    "Manjushri - Wisdom that sees dependent arising",
    "Jewish Creation (Bereshit) - God creates by divine word",
    "Hindu Creation - Brahma creates from cosmic egg",
    "Greek Creation - Gods emerge from Chaos",
    "Norse Creation - Gods create from giant's body"
  ]
}
```

</details>

---

### `creatures` Schema

#### Schema Variation 1

**Fields:**
- `abilities` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `habitats` (array)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `relationships` (object)
- `type` (string)
- `weaknesses` (array)

**Sample Documents:**

<details>
<summary>Document 1: babylonian_mushussu</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:01.574Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/creatures/mushussu.html",
    "updatedAt": "2025-12-13T02:38:01.575Z"
  },
  "habitats": [],
  "displayName": "🐉 Mušḫuššu",
  "description": "",
  "type": "dragon",
  "mythology": "babylonian",
  "abilities": [
    "Venomous Bite: Fangs dripping with lethal poison, killing with a single strike",
    "Impenetrable Scales: Armor-like hide that deflects weapons and spells",
    "Divine Radiance: Surrounded by a terrifying aura that causes enemies to collapse in fear",
    "Hybrid Strength: Combining lion's power, serpent's flexibility, and eagle's speed",
    "Sacred Authority: As Marduk's mount, commands respect from lesser spirits and demons",
    "Guardian Magic: Presence wards off evil and protects sacred spaces"
  ],
  "relationships": {},
  "filename": "mushussu",
  "weaknesses": [],
  "name": "Babylonian Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "babylonian_mushussu"
}
```

</details>

<details>
<summary>Document 2: babylonian_scorpion-men</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:01.598Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/creatures/scorpion-men.html",
    "updatedAt": "2025-12-13T02:38:01.598Z"
  },
  "habitats": [],
  "displayName": "🦂 Scorpion-Men (Girtablilu)",
  "description": "",
  "type": "dragon",
  "mythology": "babylonian",
  "abilities": [],
  "relationships": {},
  "filename": "scorpion-men",
  "weaknesses": [],
  "name": "Men",
  "primarySources": [],
  "attributes": [],
  "id": "babylonian_scorpion-men"
}
```

</details>

<details>
<summary>Document 3: buddhist_nagas</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:01.552Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/creatures/nagas.html",
    "updatedAt": "2025-12-13T02:38:01.552Z"
  },
  "habitats": [],
  "displayName": "🐍 Nagas",
  "description": "",
  "type": "dragon",
  "mythology": "buddhist",
  "abilities": [],
  "relationships": {},
  "filename": "nagas",
  "weaknesses": [],
  "name": "Serpent Deities of Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "buddhist_nagas"
}
```

</details>

<details>
<summary>Document 4: christian_angels</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:01.695Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/creatures/angels.html",
    "updatedAt": "2025-12-13T02:38:01.695Z"
  },
  "habitats": [],
  "displayName": "👼 Angels",
  "description": "",
  "type": "dragon",
  "mythology": "christian",
  "abilities": [],
  "relationships": {},
  "filename": "angels",
  "weaknesses": [],
  "name": "Christian Creatures",
  "primarySources": [],
  "attributes": [
    "Spiritual Nature: Pure spirits without material bodies",
    "Intelligence: Superior knowledge and understanding",
    "Power: Greater strength than humans, but limited compared to God",
    "Immortality: Do not age or die",
    "Free Will: Can choose to serve or rebel against God (choice made once, irrevocably)",
    "Multitude: Countless in number—Scripture speaks of \"myriads\" and \"ten thousand times ten thousand\""
  ],
  "id": "christian_angels"
}
```

</details>

<details>
<summary>Document 5: christian_hierarchy</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:01.657Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/creatures/angels/hierarchy.html",
    "updatedAt": "2025-12-13T02:38:01.657Z"
  },
  "habitats": [],
  "displayName": "📊 Angelic Hierarchy - The Nine Choirs",
  "description": "Nine orders of angels arranged in three hierarchies (triads), each reflecting different aspects of divine glory\n        and serving distinct functions in God's cosmic plan. This systematic ordering was established by\n        Pseudo-Dionysius the Areopagite in his 5th-6th century treatise De Coelesti Hierarchia\n        (On the Celestial Hierarchy), drawing from biblical sources and theological contemplation.",
  "type": "spirit",
  "mythology": "christian",
  "abilities": [],
  "relationships": {},
  "filename": "hierarchy",
  "weaknesses": [],
  "name": "The Nine Choirs",
  "primarySources": [],
  "attributes": [],
  "id": "christian_hierarchy"
}
```

</details>

---

### `cross_references` Schema

#### Schema Variation 1

**Fields:**
- `id` (string)
- `relatedContent` (array)

**Sample Documents:**

<details>
<summary>Document 1: aengus</summary>

```json
{
  "relatedContent": [
    "norse_afterlife",
    "chinese_creation",
    "celtic_afterlife",
    "babylonian_creation",
    "amun-ra",
    "an",
    "brigid",
    "cernunnos",
    "dagda",
    "danu",
    "lugh",
    "manannan",
    "morrigan",
    "nuada",
    "ogma",
    "celtic_creation"
  ],
  "id": "aengus"
}
```

</details>

<details>
<summary>Document 2: ah-puch</summary>

```json
{
  "relatedContent": [
    "dagda",
    "morrigan",
    "holy-spirit",
    "babylonian_afterlife",
    "sumerian_afterlife",
    "sumerian_anunnaki",
    "islamic_jinn",
    "norse_afterlife",
    "chinese_creation",
    "celtic_afterlife",
    "babylonian_creation",
    "chaac",
    "itzamna",
    "ixchel",
    "kukulkan"
  ],
  "id": "ah-puch"
}
```

</details>

<details>
<summary>Document 3: ahura-mazda</summary>

```json
{
  "relatedContent": [
    "ea",
    "dagda",
    "morrigan",
    "holy-spirit",
    "babylonian_afterlife",
    "sumerian_afterlife",
    "sumerian_anunnaki",
    "islamic_jinn",
    "norse_afterlife",
    "chinese_creation",
    "celtic_afterlife",
    "babylonian_creation",
    "persian_afterlife",
    "persian_asha",
    "persian_chinvat-bridge",
    "persian_creation",
    "persian_druj",
    "persian_frashokereti",
    "persian_threefold-path",
    "persian_div"
  ],
  "id": "ahura-mazda"
}
```

</details>

<details>
<summary>Document 4: allah</summary>

```json
{
  "relatedContent": [
    "dagda",
    "morrigan",
    "holy-spirit",
    "babylonian_afterlife",
    "sumerian_afterlife",
    "sumerian_anunnaki",
    "islamic_jinn",
    "norse_afterlife",
    "chinese_creation",
    "celtic_afterlife",
    "babylonian_creation",
    "islamic_afterlife",
    "islamic_creation",
    "islamic_tawhid",
    "islamic_black-seed",
    "islamic_miswak",
    "islamic_senna",
    "islamic_ibrahim",
    "islamic_isa",
    "islamic_musa"
  ],
  "id": "allah"
}
```

</details>

<details>
<summary>Document 5: amaterasu</summary>

```json
{
  "id": "amaterasu",
  "relatedContent": [
    "ea",
    "norse_afterlife",
    "chinese_creation",
    "celtic_afterlife",
    "babylonian_creation",
    "inari",
    "izanagi",
    "izanami",
    "susanoo",
    "tsukuyomi",
    "japanese_amaterasu-cave",
    "japanese_creation-of-japan",
    "japanese_izanagi-yomi",
    "japanese_susanoo-orochi"
  ]
}
```

</details>

---

### `deities` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: aztec_coatlicue</summary>

```json
{
  "id": "coatlicue",
  "name": "Coatlicue",
  "displayName": "👾 Coatlicue",
  "mythology": "aztec",
  "title": "Aztec - Coatlicue",
  "description": "Coatlicue - \"Serpent Skirt\" / \"She of the Serpent Skirt\"",
  "archetypes": [],
  "domains": [
    "Earth",
    "fertility",
    "creation",
    "death",
    "the grave",
    "serpents",
    "childbirth",
    "the stars (as their mother)",
    "Primordial mother goddess",
    "mother of Huitzilopochtli",
    "Coyolxauhqui",
    "and the 400 southern stars"
  ],
  "symbols": [
    "Serpents",
    "skulls",
    "human hearts and hands",
    "clawed feet",
    "dual serpent heads",
    "the earth itself",
    "Serpents (especially rattlesnakes)",
    "eagles",
    "jaguars",
    "Her most defining feature - a skirt made of intertwined serpents",
    "representing the earth's fertility and dangerous power"
  ],
  "epithets": [
    "Coatlicue",
    "Teteoinan (\"Mother of Gods\")",
    "Toci (\"Our Grandmother\")"
  ],
  "attributes": [],
  "relationships": {},
  "primarySources": [],
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Gaia\n                        Greek",
      "link": "../../greek/deities/gaia.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Kali\n                        Hindu",
      "link": "../../hindu/deities/kali.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Hel\n                        Norse",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Isis\n                        Egyptian",
      "link": "../../egyptian/deities/isis.html"
    }
  ],
  "metadata": {
    "createdBy": "system",
    "source": "html_parser",
    "verified": false,
    "submissionType": "system",
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    },
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    }
  }
}
```

</details>

<details>
<summary>Document 2: aztec_huitzilopochtli</summary>

```json
{
  "id": "huitzilopochtli",
  "name": "Huitzilopochtli",
  "displayName": "☀ Huitzilopochtli",
  "mythology": "aztec",
  "title": "Aztec - Huitzilopochtli",
  "description": "Huitzilopochtli - \"Hummingbird of the South\" / \"Left-Handed Hummingbird\"",
  "archetypes": [],
  "domains": [
    "War",
    "sun",
    "human sacrifice",
    "Mexica nation",
    "warriors",
    "the south"
  ],
  "symbols": [
    "Xiuhcoatl (fire serpent)",
    "hummingbird feathers",
    "eagle",
    "sun disk",
    "human hearts",
    "Hummingbird",
    "eagle (symbol of the sun and warriors)",
    "Warrior with hummingbird helmet and feather headdress",
    "blue-painted body",
    "holding shield and fire serpent"
  ],
  "epithets": [
    "Huitzilopochtli",
    "Aztec warriors believed fallen soldiers returned as hummingbirds to follow the sun",
    "Totec (\"Our Lord\")",
    "Blue Tezcatlipoca",
    "Portent of War"
  ],
  "attributes": [],
  "relationships": {},
  "primarySources": [],
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Ares\n                        Greek",
      "link": "../../greek/deities/ares.html"
    },
    {
      "type": "deity",
      "name": "🇹\n                        Mars\n                        Roman",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Ra\n                        Egyptian",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Thor\n                        Norse",
      "link": "../../norse/deities/thor.html"
    }
  ],
  "metadata": {
    "createdBy": "system",
    "source": "html_parser",
    "verified": false,
    "submissionType": "system",
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    },
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    }
  }
}
```

</details>

<details>
<summary>Document 3: aztec_quetzalcoatl</summary>

```json
{
  "id": "quetzalcoatl",
  "name": "Quetzalcoatl",
  "displayName": "🐍 Quetzalcoatl",
  "mythology": "aztec",
  "title": "Aztec - Quetzalcoatl",
  "description": "Quetzalcoatl - \"Feathered Serpent\" / \"Precious Twin\"",
  "archetypes": [],
  "domains": [
    "Wind",
    "air",
    "learning",
    "knowledge",
    "arts",
    "dawn",
    "the morning star (Venus)",
    "priesthood",
    "merchants"
  ],
  "symbols": [
    "Feathered serpent",
    "wind jewel (ehecailacocozcatl)",
    "conch shell",
    "Venus",
    "quetzal feathers",
    "Quetzal bird",
    "rattlesnake",
    "spider monkey",
    "dog (Xolotl)",
    "Depicted as a serpent covered in quetzal feathers",
    "or as a man with a beard wearing a conical hat and wind jewel",
    "As the morning star",
    "he was associated with death and resurrection",
    "disappearing and reappearing"
  ],
  "epithets": [
    "Quetzalcoatl",
    "Ehecatl (Wind aspect)",
    "Ce Acatl Topiltzin (historical priest-king)"
  ],
  "attributes": [],
  "relationships": {},
  "primarySources": [],
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Prometheus\n                        Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Thoth\n                        Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Odin\n                        Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Vishnu\n                        Hindu",
      "link": "../../hindu/deities/vishnu.html"
    }
  ],
  "metadata": {
    "createdBy": "system",
    "source": "html_parser",
    "verified": false,
    "submissionType": "system",
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    },
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    }
  }
}
```

</details>

<details>
<summary>Document 4: aztec_tezcatlipoca</summary>

```json
{
  "id": "tezcatlipoca",
  "name": "Tezcatlipoca",
  "displayName": "🪙 Tezcatlipoca",
  "mythology": "aztec",
  "title": "Aztec - Tezcatlipoca",
  "description": "Tezcatlipoca - \"Smoking Mirror\"",
  "archetypes": [],
  "domains": [
    "Night",
    "darkness",
    "sorcery",
    "divination",
    "fate",
    "beauty",
    "war",
    "discord",
    "jaguars",
    "obsidian",
    "rulership"
  ],
  "symbols": [
    "Obsidian mirror",
    "jaguar",
    "obsidian knife",
    "eagle",
    "turkey",
    "severed foot",
    "yellow and black stripes",
    "Jaguar (his nahual/spirit form)",
    "coyote",
    "owl",
    "An obsidian mirror replacing his foot or worn on his chest",
    "from which smoke emanates - showing visions of the past",
    "present",
    "and future"
  ],
  "epithets": [
    "Tezcatlipoca",
    "Titlacauan (\"We are his Slaves\")",
    "Ipalnemoani (\"He by whom we live\")",
    "Yohualli Ehecatl (\"Night Wind\")",
    "Moyocoyani (\"Capricious One\")"
  ],
  "attributes": [],
  "relationships": {},
  "primarySources": [],
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🛡\n                        Loki\n                        Norse",
      "link": "../../norse/deities/loki.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Set\n                        Egyptian",
      "link": "../../egyptian/deities/set.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Hades\n                        Greek",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Shiva\n                        Hindu",
      "link": "../../hindu/deities/shiva.html"
    }
  ],
  "metadata": {
    "createdBy": "system",
    "source": "html_parser",
    "verified": false,
    "submissionType": "system",
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    },
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    }
  }
}
```

</details>

<details>
<summary>Document 5: aztec_tlaloc</summary>

```json
{
  "id": "tlaloc",
  "name": "Tlaloc",
  "displayName": "🌧 Tlaloc",
  "mythology": "aztec",
  "title": "Aztec - Tlaloc",
  "description": "Tlaloc - \"He Who Makes Things Sprout\" / \"Earth\"",
  "archetypes": [],
  "domains": [
    "Rain",
    "water",
    "fertility",
    "agriculture",
    "lightning",
    "thunder",
    "mountains (where clouds gather)"
  ],
  "symbols": [
    "Goggle eyes",
    "fanged mouth",
    "jade",
    "maize",
    "water jugs",
    "lightning bolts",
    "herons",
    "frogs",
    "Frogs (heralds of rain)",
    "jaguars",
    "serpents",
    "snails",
    "Mount Tlaloc",
    "where his main shrine stood 4",
    "120 meters high",
    "His most distinctive feature - circular rings around the eyes",
    "possibly representing rain clouds",
    "water",
    "or serpent coils"
  ],
  "epithets": [
    "Tlaloc",
    "Tlamacazqui (\"The Provider\")",
    "Lord of the Third Heaven"
  ],
  "attributes": [],
  "relationships": {},
  "primarySources": [],
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Zeus\n                        Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Thor\n                        Norse",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Indra\n                        Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "🐉\n                        Dragon Kings\n                        Chinese",
      "link": "../../chinese/deities/dragon-kings.html"
    }
  ],
  "metadata": {
    "createdBy": "system",
    "source": "html_parser",
    "verified": false,
    "submissionType": "system",
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    },
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 251000000
    }
  }
}
```

</details>

---

### `egyptian` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: amun-ra</summary>

```json
{
  "epithets": [],
  "displayName": "Amun-Ra (Amen-Ra)",
  "description": "King of the Gods, The Hidden Sun",
  "domains": [],
  "title": "Amun-Ra - King of the Gods | Egyptian Mythology",
  "symbols": [],
  "mythology": "egyptian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": "Amun-Ra (Amen-Ra)",
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Ra",
  "primarySources": [
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amen",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amen",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "King of the Gods",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Hidden One",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Power",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=sekhem"
    },
    {
      "term": "King of the Gods",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amun",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Amen",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amun"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    }
  ],
  "attributes": [],
  "id": "amun-ra",
  "relatedEntities": []
}
```

</details>

<details>
<summary>Document 2: anhur</summary>

```json
{
  "epithets": [],
  "displayName": "Anhur (Onuris)",
  "description": "God of War and Hunting",
  "domains": [],
  "title": "Anhur (Onuris) - Egyptian Mythology",
  "symbols": [],
  "mythology": "egyptian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": "Anhur (Onuris)",
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Egyptian Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "anhur",
  "relatedEntities": []
}
```

</details>

<details>
<summary>Document 3: anubis</summary>

```json
{
  "epithets": [
    "Lord of the Sacred Land",
    "He Who Is Upon His Sacred Mountain",
    "Master of Secrets",
    "Guardian of the Scales",
    "Foremost of the Divine Booth"
  ],
  "displayName": "Anubis (Inpu, Anpu)",
  "description": "Guardian of the Dead, Lord of Mummification, Guide of Souls",
  "domains": [
    "Lord of the Sacred Land",
    "He Who Is Upon His Sacred Mountain",
    "Master of Secrets",
    "Guardian of the Scales",
    "Foremost of the Divine Booth",
    "Death",
    "mummification",
    "embalming",
    "the afterlife",
    "judgment of souls",
    "protection of tombs",
    "necropolis"
  ],
  "title": "Anubis - God of Mummification | Egyptian Mythology",
  "symbols": [
    "Jackal",
    "black dog",
    "embalming tools",
    "scales of justice",
    "ankh",
    "was scepter",
    "flail",
    "black dog (associated with desert scavengers who frequented burial grounds)",
    "Myrrh",
    "frankincense (used in embalming)",
    "natron (purification)"
  ],
  "mythology": "egyptian",
  "relationships": {
    "children": [
      "kebechet (goddess of purification",
      "cooling water for the dead)\nsiblings: various",
      "isis (partner in mummification)",
      "thoth (fellow guardian of judgment)",
      "ma'at (justice he upholds)",
      "tomb robbers",
      "those who desecrate the dead",
      "demons of the duat who threaten souls"
    ],
    "consort": "anput (female form of anubis)",
    "father": "consort: anput (female form of anubis)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "kebechet (goddess of purification",
        "cooling water for the dead)\nsiblings: various",
        "isis (partner in mummification)",
        "thoth (fellow guardian of judgment)",
        "ma'at (justice he upholds)",
        "tomb robbers",
        "those who desecrate the dead",
        "demons of the duat who threaten souls"
      ],
      "consort": "anput (female form of anubis)",
      "father": "consort: anput (female form of anubis)"
    },
    "epithets": [
      "Lord of the Sacred Land",
      "He Who Is Upon His Sacred Mountain",
      "Master of Secrets",
      "Guardian of the Scales",
      "Foremost of the Divine Booth"
    ],
    "archetypes": [],
    "displayName": "Anubis (Inpu, Anpu)",
    "domains": [
      "Lord of the Sacred Land",
      "He Who Is Upon His Sacred Mountain",
      "Master of Secrets",
      "Guardian of the Scales",
      "Foremost of the Divine Booth",
      "Death",
      "mummification",
      "embalming",
      "the afterlife",
      "judgment of souls",
      "protection of tombs",
      "necropolis"
    ],
    "attributes": [],
    "symbols": [
      "Jackal",
      "black dog",
      "embalming tools",
      "scales of justice",
      "ankh",
      "was scepter",
      "flail",
      "black dog (associated with desert scavengers who frequented burial grounds)",
      "Myrrh",
      "frankincense (used in embalming)",
      "natron (purification)"
    ]
  },
  "name": "God of Mummification | Egyptian Mythology",
  "primarySources": [
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Inpu",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anpu",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Lord of the Sacred Land",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Foremost of the Divine Booth",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Justice",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Nephthys",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=nephthys"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Life",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ankh"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Truth",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Justice",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Soul",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ba"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Set",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=set"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Set",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=set"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Set",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=set"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Duat",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=duat"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Pyramid Texts",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=pyramid_texts"
    },
    {
      "term": "Book of the Dead",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=book_of_dead"
    },
    {
      "term": "Spell 125",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=book_of_dead"
    },
    {
      "term": "Judgment scene",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=book_of_gates"
    },
    {
      "term": "Papyrus of Ani",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=book_of_dead"
    },
    {
      "term": "Coffin Texts",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=coffin_texts"
    },
    {
      "term": "Amduat",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=amduat"
    },
    {
      "term": "Nephthys",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=nephthys"
    },
    {
      "term": "Set",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=set"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Justice",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Set",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=set"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Duat",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=duat"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Was",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=was"
    },
    {
      "term": "Was",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=was"
    },
    {
      "term": "Was",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=was"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Underworld",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=duat"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Duat",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=duat"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Ma'at",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Ba",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ba"
    },
    {
      "term": "Life",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ankh"
    },
    {
      "term": "Osiris",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=osiris"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    },
    {
      "term": "Was",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=was"
    },
    {
      "term": "Ankh",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ankh"
    },
    {
      "term": "Book of the Dead",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=book_of_dead"
    },
    {
      "term": "Anubis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=anubis"
    }
  ],
  "attributes": [],
  "id": "anubis",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Duat",
      "link": "../cosmology/duat.html"
    },
    {
      "type": "cosmology",
      "name": "Duat",
      "link": "../cosmology/duat.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: apep</summary>

```json
{
  "epithets": [],
  "displayName": "Apep (Apophis)",
  "description": "Serpent of Chaos, Enemy of Ra",
  "domains": [],
  "title": "Apep - Chaos Serpent | Egyptian Mythology",
  "symbols": [],
  "mythology": "egyptian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": "Apep (Apophis)",
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Chaos Serpent | Egyptian Mythology",
  "primarySources": [
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apophis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apophis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Serpent of Chaos",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Enemy of Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Isfet",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Ma'at",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Order",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=maat"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apep",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    },
    {
      "term": "Apophis",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=apep"
    }
  ],
  "attributes": [],
  "id": "apep",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Duat",
      "link": "../cosmology/duat.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: atum</summary>

```json
{
  "epithets": [],
  "displayName": "Atum (Tem, Temu)",
  "description": "The Complete One, First God, Setting Sun",
  "domains": [],
  "title": "Atum - The Self-Created God | Egyptian Mythology",
  "symbols": [],
  "mythology": "egyptian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": "Atum (Tem, Temu)",
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "The Self",
  "primarySources": [
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Tem",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Tem",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "The Complete One",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Ra",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ra"
    },
    {
      "term": "Ennead",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=ennead"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Atum",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    },
    {
      "term": "Tem",
      "tradition": "egyptian",
      "href": "../corpus-search.html?term=atum"
    }
  ],
  "attributes": [],
  "id": "atum",
  "relatedEntities": []
}
```

</details>

---

### `greek` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: aphrodite</summary>

```json
{
  "epithets": [
    "Foam-Born",
    "Cyprian",
    "Cytherea",
    "Laughter-Loving",
    "Golden Aphrodite"
  ],
  "displayName": "💘 Aphrodite",
  "description": "Goddess of Love, Beauty, and Desire",
  "domains": [
    "Foam-Born",
    "Cyprian",
    "Cytherea",
    "Laughter-Loving",
    "Golden Aphrodite",
    "Love",
    "beauty",
    "desire",
    "sexuality",
    "pleasure",
    "procreation"
  ],
  "title": "Greek - Aphrodite",
  "symbols": [
    "Dove",
    "swan",
    "rose",
    "myrtle",
    "scallop shell",
    "mirror",
    "girdle",
    "sparrow",
    "goose",
    "dolphin",
    "Rose",
    "apple",
    "pomegranate",
    "lime tree"
  ],
  "mythology": "greek",
  "relationships": {
    "children": [
      "eros (cupid)",
      "harmonia",
      "phobos",
      "deimos (by ares)",
      "aeneas (by anchises)",
      "hermaphroditus (by hermes)",
      "god of love",
      "charm"
    ],
    "consort": "hephaestus (arranged by zeus)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "eros (cupid)",
        "harmonia",
        "phobos",
        "deimos (by ares)",
        "aeneas (by anchises)",
        "hermaphroditus (by hermes)",
        "god of love",
        "charm"
      ],
      "consort": "hephaestus (arranged by zeus)"
    },
    "epithets": [
      "Foam-Born",
      "Cyprian",
      "Cytherea",
      "Laughter-Loving",
      "Golden Aphrodite"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Foam-Born",
      "Cyprian",
      "Cytherea",
      "Laughter-Loving",
      "Golden Aphrodite",
      "Love",
      "beauty",
      "desire",
      "sexuality",
      "pleasure",
      "procreation"
    ],
    "attributes": [],
    "symbols": [
      "Dove",
      "swan",
      "rose",
      "myrtle",
      "scallop shell",
      "mirror",
      "girdle",
      "sparrow",
      "goose",
      "dolphin",
      "Rose",
      "apple",
      "pomegranate",
      "lime tree"
    ]
  },
  "name": "Aphrodite",
  "primarySources": [
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Foam-Born",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Cyprian",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Cytherea",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Laughter-Loving",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Influence",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=auctoritas"
    },
    {
      "term": "Kronos",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=kronos"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Hera",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hera"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "God of War",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=mars"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Poseidon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=poseidon"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Aeneas",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=aeneas"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    }
  ],
  "attributes": [],
  "id": "aphrodite",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Venus\n                Roman",
      "link": "../../roman/deities/venus.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Freya\n                Norse",
      "link": "../../norse/deities/freya.html"
    },
    {
      "type": "deity",
      "name": "🌟\n                Ishtar\n                Mesopotamian",
      "link": "../../babylonian/deities/ishtar.html"
    },
    {
      "type": "deity",
      "name": "🔺\n                Hathor\n                Egyptian",
      "link": "../../egyptian/deities/hathor.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: apollo</summary>

```json
{
  "epithets": [
    "Phoebus Apollo (Bright)",
    "Musagetes (Leader of Muses)",
    "Paean (Healer)",
    "Pythian (of Delphi)"
  ],
  "displayName": "☀️ Apollo",
  "description": "God of Light, Music, Prophecy, and Healing",
  "domains": [
    "Phoebus Apollo (Bright)",
    "Musagetes (Leader of Muses)",
    "Paean (Healer)",
    "Pythian (of Delphi)",
    "Sun/light",
    "music",
    "poetry",
    "prophecy",
    "healing",
    "plague",
    "archery",
    "truth",
    "order"
  ],
  "title": "Greek - Apollo",
  "symbols": [
    "Lyre",
    "silver bow and arrows",
    "laurel wreath",
    "tripod",
    "raven",
    "swan",
    "Swan",
    "crow",
    "dolphin",
    "wolf",
    "mouse",
    "snake",
    "Laurel (bay)",
    "hyacinth",
    "cypress"
  ],
  "mythology": "greek",
  "relationships": {
    "mother": "of asclepius)",
    "children": [
      "asclepius (god of medicine",
      "from coronis)",
      "aristaeus (rustic god",
      "from cyrene)",
      "orpheus (legendary musician",
      "possibly apollo's son)",
      "ion (ancestor of ionians)",
      "various others\nsiblings: artemis (twin sister",
      "born just before apollo)",
      "plus all zeus's other children including athena",
      "hermes",
      "dionysus",
      "closest relationship)",
      "the muses (he leads their choir)",
      "asclepius (son",
      "until zeus killed him)",
      "leto (mother",
      "whom he fiercely protects)",
      "dionysus (half-brother",
      "python (slain at delphi)"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "of asclepius)",
      "children": [
        "asclepius (god of medicine",
        "from coronis)",
        "aristaeus (rustic god",
        "from cyrene)",
        "orpheus (legendary musician",
        "possibly apollo's son)",
        "ion (ancestor of ionians)",
        "various others\nsiblings: artemis (twin sister",
        "born just before apollo)",
        "plus all zeus's other children including athena",
        "hermes",
        "dionysus",
        "closest relationship)",
        "the muses (he leads their choir)",
        "asclepius (son",
        "until zeus killed him)",
        "leto (mother",
        "whom he fiercely protects)",
        "dionysus (half-brother",
        "python (slain at delphi)"
      ]
    },
    "epithets": [
      "Phoebus Apollo (Bright)",
      "Musagetes (Leader of Muses)",
      "Paean (Healer)",
      "Pythian (of Delphi)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Phoebus Apollo (Bright)",
      "Musagetes (Leader of Muses)",
      "Paean (Healer)",
      "Pythian (of Delphi)",
      "Sun/light",
      "music",
      "poetry",
      "prophecy",
      "healing",
      "plague",
      "archery",
      "truth",
      "order"
    ],
    "attributes": [],
    "symbols": [
      "Lyre",
      "silver bow and arrows",
      "laurel wreath",
      "tripod",
      "raven",
      "swan",
      "Swan",
      "crow",
      "dolphin",
      "wolf",
      "mouse",
      "snake",
      "Laurel (bay)",
      "hyacinth",
      "cypress"
    ]
  },
  "name": "Apollo",
  "primarySources": [
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "God of Light",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=apollo"
    },
    {
      "term": "Greek",
      "tradition": null,
      "href": "../corpus-search.html?term=greek"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Excellence",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?term=attributes"
    },
    {
      "term": "Phoebus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Muses",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=muses"
    },
    {
      "term": "Pythian",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "myths",
      "tradition": null,
      "href": "../corpus-search.html?term=myths"
    },
    {
      "term": "Key Myths",
      "tradition": null,
      "href": "../corpus-search.html?term=key myths"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Hera",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hera"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Pythian",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Muses",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=muses"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "traditions",
      "tradition": null,
      "href": "../corpus-search.html?term=traditions"
    },
    {
      "term": "Relationships",
      "tradition": null,
      "href": "../corpus-search.html?term=relationships"
    },
    {
      "term": "Zeus",
      "tradition": null,
      "href": "../corpus-search.html?term=zeus"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Enemies",
      "tradition": null,
      "href": "../corpus-search.html?term=enemies"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Muses",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=muses"
    },
    {
      "term": "Zeus",
      "tradition": null,
      "href": "../corpus-search.html?term=zeus"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred sites"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Pythian",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Pythian",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?term=offerings"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?term=offerings"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Invocations",
      "tradition": null,
      "href": "../corpus-search.html?term=invocations"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?term=offerings"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "apollo",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🦅\n                Apollo\n                Roman",
      "link": "../../roman/deities/apollo.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Ra\n                Egyptian",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Lugh\n                Celtic",
      "link": "../../celtic/deities/lugh.html"
    },
    {
      "type": "deity",
      "name": "🎌\n                Amaterasu\n                Japanese",
      "link": "../../japanese/deities/amaterasu.html"
    },
    {
      "type": "hero",
      "name": "🎵 Orpheus",
      "link": "../heroes/orpheus.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: ares</summary>

```json
{
  "epithets": [
    "God of War",
    "Bane of Mortals",
    "Insatiable in Battle",
    "Shield-Piercer"
  ],
  "displayName": "⚔️ Ares",
  "description": "God of War, Bloodlust, and Violence",
  "domains": [
    "God of War",
    "Bane of Mortals",
    "Insatiable in Battle",
    "Shield-Piercer",
    "War",
    "battle",
    "bloodlust",
    "violence",
    "courage",
    "civil order"
  ],
  "title": "Greek - Ares",
  "symbols": [
    "Spear",
    "sword",
    "shield",
    "helmet",
    "chariot",
    "vulture",
    "dog",
    "Vulture",
    "serpent",
    "barn owl",
    "woodpecker",
    "None particularly associated"
  ],
  "mythology": "greek",
  "relationships": {
    "children": [
      "phobos (fear)",
      "deimos (terror)",
      "harmonia",
      "the amazons (various daughters)",
      "eros (in some traditions)\nsiblings: hephaestus",
      "hebe",
      "eileithyia",
      "half-siblings including athena",
      "apollo",
      "artemis",
      "terror",
      "accompany him to battle\nenyo: goddess of war",
      "destruction",
      "his companion in battle\neris: goddess of discord",
      "strife"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "phobos (fear)",
        "deimos (terror)",
        "harmonia",
        "the amazons (various daughters)",
        "eros (in some traditions)\nsiblings: hephaestus",
        "hebe",
        "eileithyia",
        "half-siblings including athena",
        "apollo",
        "artemis",
        "terror",
        "accompany him to battle\nenyo: goddess of war",
        "destruction",
        "his companion in battle\neris: goddess of discord",
        "strife"
      ]
    },
    "epithets": [
      "God of War",
      "Bane of Mortals",
      "Insatiable in Battle",
      "Shield-Piercer"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "God of War",
      "Bane of Mortals",
      "Insatiable in Battle",
      "Shield-Piercer",
      "War",
      "battle",
      "bloodlust",
      "violence",
      "courage",
      "civil order"
    ],
    "attributes": [],
    "symbols": [
      "Spear",
      "sword",
      "shield",
      "helmet",
      "chariot",
      "vulture",
      "dog",
      "Vulture",
      "serpent",
      "barn owl",
      "woodpecker",
      "None particularly associated"
    ]
  },
  "name": "Ares",
  "primarySources": [
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "God of War",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=mars"
    },
    {
      "term": "God of War",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=mars"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "God of War",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=mars"
    },
    {
      "term": "Bane of Mortals",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Shield-Piercer",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Courage",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Heracles",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=heracles"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Heracles",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=heracles"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Olympus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=olympus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Hera",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hera"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Courage",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Influence",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=auctoritas"
    },
    {
      "term": "Courage",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    }
  ],
  "attributes": [],
  "id": "ares",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🦅\n                Mars\n                Roman",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Tyr\n                Norse",
      "link": "../../norse/deities/tyr.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                The Morrigan\n                Celtic",
      "link": "../../celtic/deities/morrigan.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Nergal\n                Mesopotamian",
      "link": "../../babylonian/deities/nergal.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: artemis</summary>

```json
{
  "epithets": [
    "Huntress",
    "Maiden",
    "Lady of Wild Things",
    "Moon Goddess",
    "Protector of Youth"
  ],
  "displayName": "🏹 Artemis",
  "description": "Goddess of the Hunt, Wilderness, and the Moon",
  "domains": [
    "Huntress",
    "Maiden",
    "Lady of Wild Things",
    "Moon Goddess",
    "Protector of Youth",
    "Hunt",
    "wilderness",
    "wild animals",
    "moon",
    "childbirth",
    "virginity",
    "young girls"
  ],
  "title": "Greek - Artemis",
  "symbols": [
    "Bow and arrows",
    "crescent moon",
    "deer",
    "cypress",
    "hunting dogs",
    "Deer",
    "bear",
    "boar",
    "hunting dog",
    "guinea fowl",
    "Cypress",
    "walnut",
    "cedar",
    "myrtle",
    "amaranth"
  ],
  "mythology": "greek",
  "relationships": {
    "children": [
      "of zeus including athena",
      "hermes",
      "dionysus",
      "heracles\n\ncompanions\n\nthe hunters of artemis: b",
      "of virgin nymphs",
      "fierce",
      "loyal companions"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "of zeus including athena",
        "hermes",
        "dionysus",
        "heracles\n\ncompanions\n\nthe hunters of artemis: b",
        "of virgin nymphs",
        "fierce",
        "loyal companions"
      ]
    },
    "epithets": [
      "Huntress",
      "Maiden",
      "Lady of Wild Things",
      "Moon Goddess",
      "Protector of Youth"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Huntress",
      "Maiden",
      "Lady of Wild Things",
      "Moon Goddess",
      "Protector of Youth",
      "Hunt",
      "wilderness",
      "wild animals",
      "moon",
      "childbirth",
      "virginity",
      "young girls"
    ],
    "attributes": [],
    "symbols": [
      "Bow and arrows",
      "crescent moon",
      "deer",
      "cypress",
      "hunting dogs",
      "Deer",
      "bear",
      "boar",
      "hunting dog",
      "guinea fowl",
      "Cypress",
      "walnut",
      "cedar",
      "myrtle",
      "amaranth"
    ]
  },
  "name": "Artemis",
  "primarySources": [
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Huntress",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Maiden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Heracles",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=heracles"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Huntress",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    }
  ],
  "attributes": [],
  "id": "artemis",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🦅\n                Diana\n                Roman",
      "link": "../../roman/deities/diana.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Bastet\n                Egyptian",
      "link": "../../egyptian/deities/bastet.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: athena</summary>

```json
{
  "epithets": [
    "Pallas Athena",
    "Athena Parthenos (Virgin)",
    "Athena Promachos (Who Fights in Front)",
    "Glaukopis (Bright-Eyed)"
  ],
  "displayName": "🦉 Athena",
  "description": "Goddess of Wisdom, Strategic Warfare, and Crafts",
  "domains": [
    "Pallas Athena",
    "Athena Parthenos (Virgin)",
    "Athena Promachos (Who Fights in Front)",
    "Glaukopis (Bright-Eyed)",
    "Wisdom",
    "strategic warfare",
    "crafts",
    "weaving",
    "reason",
    "intelligent courage",
    "civilization"
  ],
  "title": "Greek - Athena",
  "symbols": [
    "Aegis (shield/breastplate)",
    "spear",
    "helmet",
    "owl",
    "Gorgoneion (Medusa's head)",
    "Owl (little owl",
    "Athene noctua)",
    "serpent",
    "Olive tree (her gift to Athens)"
  ],
  "mythology": "greek",
  "relationships": {
    "children": [
      "was received by gaia)\nsiblings: apollo",
      "artemis",
      "hermes",
      "dionysus",
      "ares",
      "hephaestus",
      "closest divine relationship)",
      "odysseus (favorite mortal hero)",
      "heracles",
      "perseus",
      "nike (goddess of victory",
      "often depicted with athena)",
      "ares (represents chaotic warfare vs"
    ],
    "father": "and closest divine relationship)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "was received by gaia)\nsiblings: apollo",
        "artemis",
        "hermes",
        "dionysus",
        "ares",
        "hephaestus",
        "closest divine relationship)",
        "odysseus (favorite mortal hero)",
        "heracles",
        "perseus",
        "nike (goddess of victory",
        "often depicted with athena)",
        "ares (represents chaotic warfare vs"
      ],
      "father": "and closest divine relationship)"
    },
    "epithets": [
      "Pallas Athena",
      "Athena Parthenos (Virgin)",
      "Athena Promachos (Who Fights in Front)",
      "Glaukopis (Bright-Eyed)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Pallas Athena",
      "Athena Parthenos (Virgin)",
      "Athena Promachos (Who Fights in Front)",
      "Glaukopis (Bright-Eyed)",
      "Wisdom",
      "strategic warfare",
      "crafts",
      "weaving",
      "reason",
      "intelligent courage",
      "civilization"
    ],
    "attributes": [],
    "symbols": [
      "Aegis (shield/breastplate)",
      "spear",
      "helmet",
      "owl",
      "Gorgoneion (Medusa's head)",
      "Owl (little owl",
      "Athene noctua)",
      "serpent",
      "Olive tree (her gift to Athens)"
    ]
  },
  "name": "Athena",
  "primarySources": [
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Goddess of Wisdom",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=minerva"
    },
    {
      "term": "Goddess of Wisdom",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=minerva"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Pallas",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=minerva"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Parthenos",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Promachos",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Courage",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Medusa",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=medusa"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Athene",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Key Myths",
      "tradition": null,
      "href": "../corpus-search.html?term=key myths"
    },
    {
      "term": "Zeus",
      "tradition": null,
      "href": "../corpus-search.html?term=zeus"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Authority",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=auctoritas"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Poseidon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=poseidon"
    },
    {
      "term": "Poseidon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=poseidon"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Excellence",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Perseus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=perseus"
    },
    {
      "term": "Medusa",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=medusa"
    },
    {
      "term": "Gorgon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=medusa"
    },
    {
      "term": "Heracles",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=heracles"
    },
    {
      "term": "Odysseus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=odysseus"
    },
    {
      "term": "Odysseus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=odysseus"
    },
    {
      "term": "Pegasus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=pegasus"
    },
    {
      "term": "Golden",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Zeus",
      "tradition": null,
      "href": "../corpus-search.html?term=zeus"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Hermes",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hermes"
    },
    {
      "term": "Dionysus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=dionysus"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Zeus",
      "tradition": null,
      "href": "../corpus-search.html?term=zeus"
    },
    {
      "term": "Enemies",
      "tradition": null,
      "href": "../corpus-search.html?term=enemies"
    },
    {
      "term": "Zeus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Odysseus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=odysseus"
    },
    {
      "term": "Heracles",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=heracles"
    },
    {
      "term": "Perseus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=perseus"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Hephaestus",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=hephaestus"
    },
    {
      "term": "Enemies",
      "tradition": null,
      "href": "../corpus-search.html?term=enemies"
    },
    {
      "term": "Poseidon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=poseidon"
    },
    {
      "term": "Ares",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=ares"
    },
    {
      "term": "Aphrodite",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=aphrodite"
    },
    {
      "term": "Sacred Sites",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred sites"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Parthenos",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Poseidon",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=poseidon"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": null,
      "href": "../corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?term=offerings"
    },
    {
      "term": "Invocations",
      "tradition": null,
      "href": "../corpus-search.html?term=invocations"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "prayers",
      "tradition": null,
      "href": "../corpus-search.html?term=prayers"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Athena",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=athena"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "athena",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🦅\n                Minerva\n                Roman",
      "link": "../../roman/deities/minerva.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Saraswati\n                Hindu",
      "link": "../../hindu/deities/saraswati.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Neith\n                Egyptian",
      "link": "../../egyptian/deities/neith.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Brigid\n                Celtic",
      "link": "../../celtic/deities/brigid.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Frigg\n                Norse",
      "link": "../../norse/deities/frigg.html"
    },
    {
      "type": "hero",
      "name": "🗡️ Perseus",
      "link": "../heroes/perseus.html"
    },
    {
      "type": "hero",
      "name": "🚢 Odysseus",
      "link": "../heroes/odysseus.html"
    }
  ]
}
```

</details>

---

### `herbs` Schema

#### Schema Variation 1

**Fields:**
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `preparation` (array)
- `primarySources` (array)
- `properties` (array)
- `rituals` (array)
- `uses` (array)

**Sample Documents:**

<details>
<summary>Document 1: buddhist_bodhi</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:13.235Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/herbs/bodhi.html",
    "updatedAt": "2025-12-13T02:38:13.235Z"
  },
  "filename": "bodhi",
  "displayName": "🌳 Bodhi Tree",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "The sacred fig tree (Ficus religiosa) under which Siddhartha Gautama attained enlightenment and became the Buddha. The original tree in Bodh Gaya is one of Buddhism's most sacred sites.",
  "uses": [],
  "id": "buddhist_bodhi",
  "rituals": [],
  "properties": [],
  "mythology": "buddhist",
  "preparation": []
}
```

</details>

<details>
<summary>Document 2: buddhist_lotus</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:13.242Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/herbs/lotus.html",
    "updatedAt": "2025-12-13T02:38:13.242Z"
  },
  "filename": "lotus",
  "displayName": "🪷 Lotus",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "The lotus flower symbolizes purity, enlightenment, and spiritual awakening. It grows from mud yet remains unstained, representing the potential for enlightenment within samsara. Different colored lotuses have different meanings.",
  "uses": [],
  "id": "buddhist_lotus",
  "rituals": [],
  "properties": [],
  "mythology": "buddhist",
  "preparation": []
}
```

</details>

<details>
<summary>Document 3: buddhist_preparations</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:13.247Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/herbs/preparations.html",
    "updatedAt": "2025-12-13T02:38:13.247Z"
  },
  "filename": "preparations",
  "displayName": "🍵 Herbal Preparations",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "Traditional methods of preparing sacred herbs, incense, and medicines used in Buddhist rituals, meditation, and healing practices.",
  "uses": [],
  "id": "buddhist_preparations",
  "rituals": [],
  "properties": [],
  "mythology": "buddhist",
  "preparation": []
}
```

</details>

<details>
<summary>Document 4: buddhist_sandalwood</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:13.254Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/herbs/sandalwood.html",
    "updatedAt": "2025-12-13T02:38:13.254Z"
  },
  "filename": "sandalwood",
  "displayName": "🌿 Sandalwood",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "description": "Sacred fragrant wood used in incense, meditation, and rituals. Its calming scent aids concentration and is believed to purify the mind and environment.",
  "uses": [],
  "id": "buddhist_sandalwood",
  "rituals": [],
  "properties": [],
  "mythology": "buddhist",
  "preparation": []
}
```

</details>

<details>
<summary>Document 5: egyptian_lotus</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:13.203Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/egyptian/herbs/lotus.html",
    "updatedAt": "2025-12-13T02:38:13.203Z"
  },
  "filename": "lotus",
  "displayName": "💙 The Blue Lotus",
  "name": "Egyptian Mythology",
  "primarySources": [],
  "description": "",
  "uses": [
    "Temple Offerings: Fresh lotus flowers offered daily to Ra and other solar deities",
    "Funerary Art: Lotus motifs adorned tombs, sarcophagi, and funerary papyri",
    "Ceremonial Use: Lotus wreaths worn at festivals, held during banquets",
    "Perfume and Ointments: Lotus essence used in sacred oils and cosmetics",
    "Meditation and Vision: The flower's mild psychoactive properties may have been used in religious experiences"
  ],
  "id": "egyptian_lotus",
  "rituals": [
    "Temple Offerings: Fresh lotus flowers offered daily to Ra and other solar deities",
    "Funerary Art: Lotus motifs adorned tombs, sarcophagi, and funerary papyri",
    "Ceremonial Use: Lotus wreaths worn at festivals, held during banquets",
    "Perfume and Ointments: Lotus essence used in sacred oils and cosmetics",
    "Meditation and Vision: The flower's mild psychoactive properties may have been used in religious experiences"
  ],
  "properties": [],
  "mythology": "egyptian",
  "preparation": []
}
```

</details>

---

### `heroes` Schema

#### Schema Variation 1

**Fields:**
- `attributes` (array)
- `companions` (array)
- `description` (string)
- `displayName` (string)
- `feats` (array)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `quests` (array)
- `relationships` (object)
- `titles` (array)
- `weapons` (array)

**Sample Documents:**

<details>
<summary>Document 1: babylonian_gilgamesh</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:36:52.592Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/heroes/gilgamesh.html",
    "updatedAt": "2025-12-13T02:36:52.592Z"
  },
  "quests": [],
  "displayName": "🏛️ Gilgamesh",
  "description": "",
  "titles": [],
  "feats": [],
  "mythology": "babylonian",
  "relationships": {},
  "filename": "gilgamesh",
  "companions": [],
  "name": "Gilgamesh",
  "primarySources": [],
  "attributes": [],
  "id": "babylonian_gilgamesh",
  "weapons": []
}
```

</details>

<details>
<summary>Document 2: babylonian_hammurabi</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:36:52.616Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/heroes/hammurabi.html",
    "updatedAt": "2025-12-13T02:36:52.616Z"
  },
  "quests": [],
  "displayName": "⚖️ Hammurabi",
  "description": "",
  "titles": [],
  "feats": [],
  "mythology": "babylonian",
  "relationships": {},
  "filename": "hammurabi",
  "companions": [],
  "name": "Hammurabi",
  "primarySources": [],
  "attributes": [],
  "id": "babylonian_hammurabi",
  "weapons": []
}
```

</details>

<details>
<summary>Document 3: buddhist_dalai_lama</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:36:52.492Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/heroes/dalai_lama.html",
    "updatedAt": "2025-12-13T02:36:52.492Z"
  },
  "quests": [],
  "displayName": "🙏 Dalai Lama",
  "description": "The spiritual leader of Tibetan Buddhism, believed to be the reincarnation of Avalokiteshvara, the Bodhisattva of Compassion. The current (14th) Dalai Lama, Tenzin Gyatso, is a Nobel Peace Prize laureate and global spiritual leader.",
  "titles": [],
  "feats": [],
  "mythology": "buddhist",
  "relationships": {},
  "filename": "dalai_lama",
  "companions": [],
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "buddhist_dalai_lama",
  "weapons": []
}
```

</details>

<details>
<summary>Document 4: buddhist_king_songtsen_gampo</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:36:52.503Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/heroes/king_songtsen_gampo.html",
    "updatedAt": "2025-12-13T02:36:52.503Z"
  },
  "quests": [],
  "displayName": "👑 King Songtsen Gampo",
  "description": "Tibetan king (7th century CE) who introduced Buddhism to Tibet. Considered an emanation of Avalokiteshvara. Built the first Buddhist temples in Tibet including the Jokhang.",
  "titles": [],
  "feats": [],
  "mythology": "buddhist",
  "relationships": {},
  "filename": "king_songtsen_gampo",
  "companions": [],
  "name": "Buddhist Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "buddhist_king_songtsen_gampo",
  "weapons": []
}
```

</details>

<details>
<summary>Document 5: buddhist_nagarjuna</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:36:52.539Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/heroes/nagarjuna.html",
    "updatedAt": "2025-12-13T02:36:52.539Z"
  },
  "quests": [],
  "displayName": "🐉 Nagarjuna",
  "description": "The Second Buddha, Founder of Madhyamaka Philosophy",
  "titles": [],
  "feats": [],
  "mythology": "buddhist",
  "relationships": {},
  "filename": "nagarjuna",
  "companions": [],
  "name": "Founder of Madhyamaka",
  "primarySources": [],
  "attributes": [],
  "id": "buddhist_nagarjuna",
  "weapons": []
}
```

</details>

---

### `hindu` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: brahma</summary>

```json
{
  "epithets": [
    "Prajapati (Lord of Creatures)",
    "Vedanatha (Lord of Vedas)",
    "Chaturmukha (Four-Faced)"
  ],
  "displayName": "🪷 Brahma",
  "description": "The Creator, Lord of the Vedas",
  "domains": [
    "Prajapati (Lord of Creatures)",
    "Vedanatha (Lord of Vedas)",
    "Chaturmukha (Four-Faced)",
    "Creation",
    "Knowledge",
    "Time",
    "Sacred Speech",
    "Arts"
  ],
  "title": "Brahma - Hindu Mythology",
  "symbols": [
    "Lotus",
    "Four Vedas",
    "Kamandalu (water pot)",
    "Prayer beads",
    "Sruva (ladle)",
    "Hamsa (Swan/Goose)",
    "symbolizing wisdom and discernment",
    "Lotus (Padma)",
    "Kusha grass",
    "Sacred fig"
  ],
  "mythology": "hindu",
  "relationships": {
    "children": [
      "the prajapatis (lords of creatures)",
      "manu (first man)",
      "four kumaras (mind-born sons)",
      "daksha",
      "narada\nsiblings: none (self-created)",
      "though part of trimurti with vishnu",
      "saraswati (his consort",
      "knowledge itself)",
      "has cursed him)",
      "the asuras (demons who challenge his creation)"
    ],
    "consort": "saraswati (goddess of knowledge"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "the prajapatis (lords of creatures)",
        "manu (first man)",
        "four kumaras (mind-born sons)",
        "daksha",
        "narada\nsiblings: none (self-created)",
        "though part of trimurti with vishnu",
        "saraswati (his consort",
        "knowledge itself)",
        "has cursed him)",
        "the asuras (demons who challenge his creation)"
      ],
      "consort": "saraswati (goddess of knowledge"
    },
    "epithets": [
      "Prajapati (Lord of Creatures)",
      "Vedanatha (Lord of Vedas)",
      "Chaturmukha (Four-Faced)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Prajapati (Lord of Creatures)",
      "Vedanatha (Lord of Vedas)",
      "Chaturmukha (Four-Faced)",
      "Creation",
      "Knowledge",
      "Time",
      "Sacred Speech",
      "Arts"
    ],
    "attributes": [],
    "symbols": [
      "Lotus",
      "Four Vedas",
      "Kamandalu (water pot)",
      "Prayer beads",
      "Sruva (ladle)",
      "Hamsa (Swan/Goose)",
      "symbolizing wisdom and discernment",
      "Lotus (Padma)",
      "Kusha grass",
      "Sacred fig"
    ]
  },
  "name": "Hindu Mythology",
  "primarySources": [
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Attributes",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=attributes"
    },
    {
      "term": "Prajapati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Chaturmukha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Vedas",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vedas"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Padma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=lakshmi"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    },
    {
      "term": "Trimurti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=trimurti"
    },
    {
      "term": "Hiranyagarbha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Myths",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=myths"
    },
    {
      "term": "Myths",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=myths"
    },
    {
      "term": "Hiranyagarbha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "World",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=world"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Hiranyagarbha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Saraswati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=saraswati"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Saraswati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=saraswati"
    },
    {
      "term": "Worship",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Related",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=related"
    },
    {
      "term": "Saraswati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=saraswati"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Surya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=surya"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Primary Sources",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=primary%20sources"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Prajapati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "brahma",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Vedas",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Trimurti",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Ptah\n                Egyptian",
      "link": "../../egyptian/deities/ptah.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Prometheus\n                Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "cosmology",
      "name": "🌀 Creation Myth",
      "link": "../cosmology/creation.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: dhanvantari</summary>

```json
{
  "epithets": [],
  "displayName": "⚕️ Dhanvantari",
  "description": "God of Ayurveda and Divine Physician",
  "domains": [],
  "title": "Dhanvantari - Hindu Mythology",
  "symbols": [],
  "mythology": "hindu",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Hindu Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "dhanvantari",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Apollo\n                Greek",
      "link": "../../greek/deities/apollo.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Imhotep\n                Egyptian",
      "link": "../../egyptian/deities/imhotep.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: durga</summary>

```json
{
  "epithets": [
    "Mahishasura-Mardini (Slayer of Mahishasura)",
    "Durgatinashini (Remover of Difficulties)",
    "Shakti (Divine Power)",
    "Devi (The Goddess)"
  ],
  "displayName": "The Nine Forms of Durga (Navadurga)",
  "description": "The Invincible Mother, Slayer of Mahishasura",
  "domains": [
    "Mahishasura-Mardini (Slayer of Mahishasura)",
    "Durgatinashini (Remover of Difficulties)",
    "Shakti (Divine Power)",
    "Devi (The Goddess)",
    "Protection",
    "Warfare",
    "Motherhood",
    "Feminine Power",
    "Victory over Evil",
    "Courage"
  ],
  "title": "Durga - Hindu Mythology",
  "symbols": [
    "Trishula (trident)",
    "Chakra (discus)",
    "Bow and Arrows",
    "Sword",
    "Lotus",
    "Conch Shell",
    "Lion (or Tiger) - her vahana",
    "representing courage and royalty",
    "Bilva leaves",
    "Red Hibiscus",
    "Durva grass",
    "Banana plant"
  ],
  "mythology": "hindu",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Mahishasura-Mardini (Slayer of Mahishasura)",
      "Durgatinashini (Remover of Difficulties)",
      "Shakti (Divine Power)",
      "Devi (The Goddess)"
    ],
    "archetypes": [],
    "displayName": "The Nine Forms of Durga (Navadurga)",
    "domains": [
      "Mahishasura-Mardini (Slayer of Mahishasura)",
      "Durgatinashini (Remover of Difficulties)",
      "Shakti (Divine Power)",
      "Devi (The Goddess)",
      "Protection",
      "Warfare",
      "Motherhood",
      "Feminine Power",
      "Victory over Evil",
      "Courage"
    ],
    "attributes": [],
    "symbols": [
      "Trishula (trident)",
      "Chakra (discus)",
      "Bow and Arrows",
      "Sword",
      "Lotus",
      "Conch Shell",
      "Lion (or Tiger) - her vahana",
      "representing courage and royalty",
      "Bilva leaves",
      "Red Hibiscus",
      "Durva grass",
      "Banana plant"
    ]
  },
  "name": "Hindu Mythology",
  "primarySources": [
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Attributes",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=attributes"
    },
    {
      "term": "Shakti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    },
    {
      "term": "Attributes",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=attributes"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Agni",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=agni"
    },
    {
      "term": "Surya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=surya"
    },
    {
      "term": "Indra",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=indra"
    },
    {
      "term": "Yama",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=yama"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Related",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=related"
    },
    {
      "term": "Primary Sources",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=primary%20sources"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Shakti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Related",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=related"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Agni",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=agni"
    },
    {
      "term": "Indra",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=indra"
    },
    {
      "term": "Brahma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahma"
    },
    {
      "term": "Surya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=surya"
    },
    {
      "term": "Kala",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=yama"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Brahman",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=brahman"
    },
    {
      "term": "World",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=world"
    },
    {
      "term": "Prakriti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Purusha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=atman"
    },
    {
      "term": "Shakti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Eternal",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=eternal"
    },
    {
      "term": "Worship",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=worship"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Rituals",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=rituals"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Worship",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Shakti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Related Concepts",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Hindu Tradition",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=within%20hindu%20tradition"
    },
    {
      "term": "Related",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=related"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Parvati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Traditions",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=traditions"
    },
    {
      "term": "Durga",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=durga"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "durga",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Trimurti",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "Athena",
      "link": "../../greek/deities/athena.html"
    },
    {
      "type": "deity",
      "name": "Ishtar",
      "link": "../../babylonian/deities/ishtar.html"
    },
    {
      "type": "deity",
      "name": "Freyja",
      "link": "../../norse/deities/freyja.html"
    },
    {
      "type": "deity",
      "name": "The Morrigan",
      "link": "../../celtic/deities/morrigan.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Athena\n                Greek",
      "link": "../../greek/deities/athena.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Ishtar\n                Mesopotamian",
      "link": "../../babylonian/deities/ishtar.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Morrigan\n                Celtic",
      "link": "../../celtic/deities/morrigan.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Freyja\n                Norse",
      "link": "../../norse/deities/freyja.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Sekhmet\n                Egyptian",
      "link": "../../egyptian/deities/sekhmet.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: dyaus</summary>

```json
{
  "epithets": [],
  "displayName": "☁️ Dyaus Pita",
  "description": "Sky Father",
  "domains": [],
  "title": "Dyaus Pita - Hindu Mythology",
  "symbols": [],
  "mythology": "hindu",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Hindu Mythology",
  "primarySources": [],
  "attributes": [],
  "id": "dyaus",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Zeus\n                Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Jupiter\n                Roman",
      "link": "../../roman/deities/jupiter.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Vedic Cosmology",
      "link": "../cosmology/creation.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: ganesha</summary>

```json
{
  "epithets": [
    "Ganapati (Lord of the Ganas)",
    "Vinayaka (Supreme Leader)",
    "Vighnaharta (Remover of Obstacles)",
    "Ekadanta (Single-Tusked)",
    "Lambodara (Pot-Bellied)"
  ],
  "displayName": "🐘 Ganesha",
  "description": "Lord of Beginnings, Remover of Obstacles",
  "domains": [
    "Ganapati (Lord of the Ganas)",
    "Vinayaka (Supreme Leader)",
    "Vighnaharta (Remover of Obstacles)",
    "Ekadanta (Single-Tusked)",
    "Lambodara (Pot-Bellied)",
    "Wisdom",
    "Success",
    "New Beginnings",
    "Intellect",
    "Arts",
    "Writing",
    "Learning",
    "Prosperity",
    "Removal of Obstacles"
  ],
  "title": "Hindu - Ganesha",
  "symbols": [
    "Broken Tusk",
    "Modaka (sweet)",
    "Ankusha (elephant goad)",
    "Pasha (noose)",
    "Axe",
    "Lotus",
    "Mushika (mouse/shrew - his vahana)",
    "Elephant (his head represents cosmic wisdom)",
    "Durva grass",
    "Red flowers",
    "Hibiscus",
    "Eranda (castor plant)"
  ],
  "mythology": "hindu",
  "relationships": {
    "mother": "parvati/uma - the divine mother",
    "father": "shiva - the destroyer/transformer of the trimurti"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "parvati/uma - the divine mother",
      "father": "shiva - the destroyer/transformer of the trimurti"
    },
    "epithets": [
      "Ganapati (Lord of the Ganas)",
      "Vinayaka (Supreme Leader)",
      "Vighnaharta (Remover of Obstacles)",
      "Ekadanta (Single-Tusked)",
      "Lambodara (Pot-Bellied)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Ganapati (Lord of the Ganas)",
      "Vinayaka (Supreme Leader)",
      "Vighnaharta (Remover of Obstacles)",
      "Ekadanta (Single-Tusked)",
      "Lambodara (Pot-Bellied)",
      "Wisdom",
      "Success",
      "New Beginnings",
      "Intellect",
      "Arts",
      "Writing",
      "Learning",
      "Prosperity",
      "Removal of Obstacles"
    ],
    "attributes": [],
    "symbols": [
      "Broken Tusk",
      "Modaka (sweet)",
      "Ankusha (elephant goad)",
      "Pasha (noose)",
      "Axe",
      "Lotus",
      "Mushika (mouse/shrew - his vahana)",
      "Elephant (his head represents cosmic wisdom)",
      "Durva grass",
      "Red flowers",
      "Hibiscus",
      "Eranda (castor plant)"
    ]
  },
  "name": "Ganesha",
  "primarySources": [
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Attributes",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=attributes"
    },
    {
      "term": "Ganapati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Vinayaka",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Vighnaharta",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Myths",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=myths"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Parvati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Parvati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Parvati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Kartikeya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=kartikeya"
    },
    {
      "term": "Kartikeya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=kartikeya"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Parvati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Nataraja",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Uma",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=parvati"
    },
    {
      "term": "Divine",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=divine"
    },
    {
      "term": "Shakti",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=maya"
    },
    {
      "term": "Kartikeya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=kartikeya"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Saraswati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=saraswati"
    },
    {
      "term": "Kartikeya",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=kartikeya"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Worship",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Primary Sources",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=primary%20sources"
    },
    {
      "term": "Sacred",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=sacred"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganapati",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Vinayaka",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Vishnu",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=vishnu"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Shiva",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=shiva"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Mahabharata",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mahabharata"
    },
    {
      "term": "Mahabharata",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mahabharata"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Mahabharata",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mahabharata"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Ganesha",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=ganesha"
    },
    {
      "term": "Mythology",
      "tradition": "hindu",
      "href": "../../../mythos/hindu/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "ganesha",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Trimurti",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Janus\n                Roman",
      "link": "../../roman/deities/janus.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Hermes\n                Greek",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Anubis\n                Egyptian",
      "link": "../../egyptian/deities/anubis.html"
    },
    {
      "type": "cosmology",
      "name": "🌀 Hindu Cosmology",
      "link": "../cosmology/creation.html"
    }
  ]
}
```

</details>

---

### `islamic` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: allah</summary>

```json
{
  "epithets": [
    "Ar-Rahman (The Compassionate)",
    "Ar-Rahim (The Merciful)"
  ],
  "displayName": "The 99 Beautiful Names (Asma al-Husna)",
  "description": "الله - The One, The Eternal, The Absolute",
  "domains": [
    "All Creation",
    "All Knowledge",
    "All Power"
  ],
  "title": "Allah - Islamic Theology",
  "symbols": [
    "Crescent Moon",
    "Star",
    "Calligraphy",
    "Quran (revealed word)"
  ],
  "mythology": "islamic",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Ar-Rahman (The Compassionate)",
      "Ar-Rahim (The Merciful)"
    ],
    "archetypes": [],
    "displayName": "The 99 Beautiful Names (Asma al-Husna)",
    "domains": [
      "All Creation",
      "All Knowledge",
      "All Power"
    ],
    "attributes": [],
    "symbols": [
      "Crescent Moon",
      "Star",
      "Calligraphy",
      "Quran (revealed word)"
    ]
  },
  "name": "Islamic Theology",
  "primarySources": [
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Core Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tawhid",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Creation",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Primary",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Creation",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Nature",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Monotheism",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Theological",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Creation",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Monotheism",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tawhid",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Islamic Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Paradise",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=king_of_kings"
    },
    {
      "term": "Sovereign",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=king_of_kings"
    },
    {
      "term": "Almighty",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=god_father"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Creation",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Five Daily Prayers",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Trust",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prayer",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Theology",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    }
  ],
  "attributes": [],
  "id": "allah",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Tawhid",
      "link": "../cosmology/tawhid.html"
    },
    {
      "type": "cosmology",
      "name": "Tawhid",
      "link": "../cosmology/tawhid.html"
    },
    {
      "type": "cosmology",
      "name": "creation",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Day of Judgment",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "cosmology",
      "name": "☪️\n                \n                    Tawhid\n                    Absolute Monotheism\n                    Oneness of Allah",
      "link": "../cosmology/tawhid.html"
    },
    {
      "type": "deity",
      "name": "✝️\n                God the Father\n                Christian Concept",
      "link": "../../christian/deities/god-father.html"
    },
    {
      "type": "hero",
      "name": "☪️\n                Ibrahim (AS)\n                Friend of Allah",
      "link": "../heroes/ibrahim.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: jibreel</summary>

```json
{
  "epithets": [
    "Ruh al-Qudus (Holy Spirit)",
    "Ruh al-Amin (Trustworthy Spirit)"
  ],
  "displayName": "Jibreel (جبريل)",
  "description": "The Angel of Revelation - Ruh al-Qudus (The Holy Spirit)",
  "domains": [
    "Bearer of Divine Revelation (Wahy)",
    "Providing Spiritual Strength (Taqwiyah)",
    "Protecting Prophets During Missions",
    "Instructing Prophets in Religious Knowledge",
    "Leading Angelic Armies in Battle of Badr",
    "Reviewing Quran with Prophet Every Ramadan"
  ],
  "title": "Jibreel (",
  "symbols": [],
  "mythology": "islamic",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Ruh al-Qudus (Holy Spirit)",
      "Ruh al-Amin (Trustworthy Spirit)"
    ],
    "archetypes": [],
    "displayName": "Jibreel (جبريل)",
    "domains": [
      "Bearer of Divine Revelation (Wahy)",
      "Providing Spiritual Strength (Taqwiyah)",
      "Protecting Prophets During Missions",
      "Instructing Prophets in Religious Knowledge",
      "Leading Angelic Armies in Battle of Badr",
      "Reviewing Quran with Prophet Every Ramadan"
    ],
    "attributes": [],
    "symbols": []
  },
  "name": "Jibreel (",
  "primarySources": [
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Ruh al-Qudus",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=holy_spirit"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Islamic Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Primary",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Other",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Ruh al-Qudus",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Holy Spirit",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=holy_spirit"
    },
    {
      "term": "Ruh al-Amin",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Primary",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tree",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=cross"
    },
    {
      "term": "Garden",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tree",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=cross"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Journey",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine Presence",
      "tradition": "jewish",
      "href": "../../../mythos/jewish/corpus-search.html?term=shekinah"
    },
    {
      "term": "Five Daily Prayers",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Mary",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=mary"
    },
    {
      "term": "Isa",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=jesus"
    },
    {
      "term": "Ibrahim",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Abraham",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Isaac",
      "tradition": "jewish",
      "href": "../../../mythos/jewish/corpus-search.html?term=isaac"
    },
    {
      "term": "Musa",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Moses",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Mount Sinai",
      "tradition": "jewish",
      "href": "../../../mythos/jewish/corpus-search.html?term=torah"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Primary",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Significance",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Belief",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Belief",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Mikail",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Faith",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=faith"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Within Islamic Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Mikail",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Israfil",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Azrael",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jesus",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=jesus"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Theology",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Creation",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Nature",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Gabriel",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Theology",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    }
  ],
  "attributes": [],
  "id": "jibreel",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Creation",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "Gabriel",
      "link": "../../christian/deities/gabriel.html"
    },
    {
      "type": "deity",
      "name": "Gabriel",
      "link": "../../christian/deities/gabriel.html"
    },
    {
      "type": "deity",
      "name": "Holy Spirit",
      "link": "../../christian/deities/holy-spirit.html"
    },
    {
      "type": "deity",
      "name": "Sraosha",
      "link": "../../persian/deities/sraosha.html"
    },
    {
      "type": "cosmology",
      "name": "🌙\n                    Night Journey\n                \n                \n                    Isra and Mi'raj\n                    Guided Muhammad through heavens",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "✡️\n                Gabriel\n                Jewish",
      "link": "../../christian/deities/gabriel.html"
    },
    {
      "type": "deity",
      "name": "✝️\n                Gabriel\n                Christian",
      "link": "../../christian/deities/gabriel.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Hermes\n                Greek",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "🔥\n                Sraosha\n                Zoroastrian",
      "link": "../../persian/deities/sraosha.html"
    },
    {
      "type": "cosmology",
      "name": "🌅 Creation",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "deity",
      "name": "✡️ Gabriel (Jewish)",
      "link": "../../christian/deities/gabriel.html"
    },
    {
      "type": "deity",
      "name": "✝️ Gabriel (Christian)",
      "link": "../../christian/deities/gabriel.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: muhammad</summary>

```json
{
  "epithets": [],
  "displayName": "🕌 Prophet Muhammad",
  "description": "محمد - The Seal of Prophets (Khatam an-Nabiyyin)",
  "domains": [],
  "title": "Prophet",
  "symbols": [],
  "mythology": "islamic",
  "relationships": {
    "mother": "aminah",
    "consort": "khadijah (first)",
    "father": "abdullah"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "aminah",
      "consort": "khadijah (first)",
      "father": "abdullah"
    },
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Prophet",
  "primarySources": [
    {
      "term": "Prophet Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Messenger",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=gabriel"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Monotheism",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Day of Judgment",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Islamic Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Core Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Al-Amin",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=god_father"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Kaaba",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=god_father"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Al-Amin",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Monotheism",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "King",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=king_of_kings"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Journey",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=ascension"
    },
    {
      "term": "Divine Presence",
      "tradition": "jewish",
      "href": "../../../mythos/jewish/corpus-search.html?term=shekinah"
    },
    {
      "term": "Five Daily Prayers",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Jibreel",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Kaaba",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Pilgrimage",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Signs",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Journey",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Ascension",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=ascension"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Tawhid",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Allah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Sunnah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Sunnah",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Practices",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Attributes",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Light",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=light_of_the_world"
    },
    {
      "term": "Significance",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Within Islamic Tradition",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Ibrahim",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Musa",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Isa",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Moses",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Father",
      "tradition": "christian",
      "href": "../../../mythos/christian/corpus-search.html?term=god_father"
    },
    {
      "term": "Prophets",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Divine",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Quran",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Hadith",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Prophet Muhammad",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    },
    {
      "term": "Theology",
      "tradition": "islamic",
      "href": "../../../mythos/islamic/index.html"
    }
  ],
  "attributes": [],
  "id": "muhammad",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Afterlife",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "hero",
      "name": "Moses",
      "link": "../../jewish/heroes/moses.html"
    },
    {
      "type": "hero",
      "name": "Abraham",
      "link": "../../jewish/heroes/abraham.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../../persian/heroes/zoroaster.html"
    },
    {
      "type": "deity",
      "name": "Krishna",
      "link": "../../hindu/deities/krishna.html"
    },
    {
      "type": "hero",
      "name": "✡️\n                Moses\n                Jewish Prophet",
      "link": "../../jewish/heroes/moses.html"
    },
    {
      "type": "hero",
      "name": "☪️\n                Ibrahim (AS)\n                Father of Prophets",
      "link": "../heroes/ibrahim.html"
    }
  ]
}
```

</details>

---

### `japanese` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: amaterasu</summary>

```json
{
  "epithets": [
    "Amaterasu-Omikami (天照大神) - \"Great August Kami Who Shines in Heaven\"",
    "Ohirume-no-Muchi (大日霪貴) - \"Great Sun Female Deity\"",
    "Tensho Daijin - Sino-Japanese reading",
    "Heaven-Shining Great Deity",
    "Ancestress of the Imperial Line",
    "Queen of the Kami",
    "Lady of the Sun"
  ],
  "displayName": "Amaterasu-Omikami (天照大神)",
  "description": "Great Divinity Illuminating Heaven",
  "domains": [
    "Sun",
    "light",
    "warmth",
    "agriculture",
    "weaving",
    "imperial sovereignty",
    "cosmic order",
    "purification"
  ],
  "title": "Japanese - Amaterasu",
  "symbols": [
    "Rising sun",
    "sacred mirror (Yata no Kagami)",
    "rice",
    "hinomaru (sun disc)",
    "golden radiance",
    "Rooster (Niwatori) - whose crow summoned her from the cave",
    "Horse (divine white horse)",
    "Sakaki (Cleyera japonica) - sacred evergreen",
    "Rice (Ine) - divine gift to humanity",
    "Yata no Kagami (eight-span mirror)",
    "Magatama jewels",
    "shimenawa (sacred rope)"
  ],
  "mythology": "japanese",
  "relationships": {
    "mother": "born not from izanami but from izanagi's left eye during his misogi purification rite",
    "children": [
      "ancestor of the imperial line\n        gr",
      "son: ninigi-no-mikoto - sent to rule earth",
      "great-gr",
      "ame-no-tajikarao (strength kami)",
      "s opposite her ordered brilliance"
    ],
    "father": "izanagi-no-mikoto - the male creator deity who gave birth to her through purification"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "born not from izanami but from izanagi's left eye during his misogi purification rite",
      "children": [
        "ancestor of the imperial line\n        gr",
        "son: ninigi-no-mikoto - sent to rule earth",
        "great-gr",
        "ame-no-tajikarao (strength kami)",
        "s opposite her ordered brilliance"
      ],
      "father": "izanagi-no-mikoto - the male creator deity who gave birth to her through purification"
    },
    "epithets": [
      "Amaterasu-Omikami (天照大神) - \"Great August Kami Who Shines in Heaven\"",
      "Ohirume-no-Muchi (大日霪貴) - \"Great Sun Female Deity\"",
      "Tensho Daijin - Sino-Japanese reading",
      "Heaven-Shining Great Deity",
      "Ancestress of the Imperial Line",
      "Queen of the Kami",
      "Lady of the Sun"
    ],
    "archetypes": [],
    "displayName": "Amaterasu-Omikami (天照大神)",
    "domains": [
      "Sun",
      "light",
      "warmth",
      "agriculture",
      "weaving",
      "imperial sovereignty",
      "cosmic order",
      "purification"
    ],
    "attributes": [],
    "symbols": [
      "Rising sun",
      "sacred mirror (Yata no Kagami)",
      "rice",
      "hinomaru (sun disc)",
      "golden radiance",
      "Rooster (Niwatori) - whose crow summoned her from the cave",
      "Horse (divine white horse)",
      "Sakaki (Cleyera japonica) - sacred evergreen",
      "Rice (Ine) - divine gift to humanity",
      "Yata no Kagami (eight-span mirror)",
      "Magatama jewels",
      "shimenawa (sacred rope)"
    ]
  },
  "name": "Amaterasu",
  "primarySources": [],
  "attributes": [],
  "id": "amaterasu",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "☀️\n                Ra\n                Egyptian - Sun God",
      "link": "../../egyptian/deities/ra.html"
    },
    {
      "type": "deity",
      "name": "🏻\n                Apollo\n                Greek - Light God",
      "link": "../../greek/deities/apollo.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Brigid\n                Celtic - Fire Goddess",
      "link": "../../celtic/deities/brigid.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: inari</summary>

```json
{
  "epithets": [
    "Inari Okami (稲荷神) - \"Great God of the Rice-Bearing Plant\"",
    "O-Inari-sama (honorific)",
    "Inari Daimyojin (Great Bright Deity)",
    "Toyouke-no-Okami (in some traditions)",
    "\"Ine-nari\" - \"rice growing/ripening\" or \"ine-o\" (rice ear) + \"naru\" (to bear fruit)",
    "Rice Bringer",
    "Fox God",
    "Prosperity Kami",
    "Patron of Merchants",
    "Guardian of Agriculture"
  ],
  "displayName": "Inari Okami (稲荷神)",
  "description": "The Rice Bearer - God of Prosperity, Foxes, and Abundance",
  "domains": [
    "Rice cultivation",
    "agriculture",
    "fertility",
    "foxes",
    "prosperity",
    "success",
    "worldly abundance",
    "Tea",
    "sake brewing",
    "smithing",
    "merchants",
    "business success",
    "swordsmiths",
    "warriors (historical)"
  ],
  "title": "Japanese - Inari",
  "symbols": [
    "White fox (kitsune) - primary messenger and representative",
    "sometimes mistakenly worshipped as Inari itself",
    "Rice (ine)",
    "tea",
    "sacred cedar",
    "bamboo",
    "Sheaves of rice",
    "jewels (wish-granting gems)",
    "keys to the rice granary",
    "red torii gates",
    "white foxes"
  ],
  "mythology": "japanese",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Inari Okami (稲荷神) - \"Great God of the Rice-Bearing Plant\"",
      "O-Inari-sama (honorific)",
      "Inari Daimyojin (Great Bright Deity)",
      "Toyouke-no-Okami (in some traditions)",
      "\"Ine-nari\" - \"rice growing/ripening\" or \"ine-o\" (rice ear) + \"naru\" (to bear fruit)",
      "Rice Bringer",
      "Fox God",
      "Prosperity Kami",
      "Patron of Merchants",
      "Guardian of Agriculture"
    ],
    "archetypes": [],
    "displayName": "Inari Okami (稲荷神)",
    "domains": [
      "Rice cultivation",
      "agriculture",
      "fertility",
      "foxes",
      "prosperity",
      "success",
      "worldly abundance",
      "Tea",
      "sake brewing",
      "smithing",
      "merchants",
      "business success",
      "swordsmiths",
      "warriors (historical)"
    ],
    "attributes": [],
    "symbols": [
      "White fox (kitsune) - primary messenger and representative",
      "sometimes mistakenly worshipped as Inari itself",
      "Rice (ine)",
      "tea",
      "sacred cedar",
      "bamboo",
      "Sheaves of rice",
      "jewels (wish-granting gems)",
      "keys to the rice granary",
      "red torii gates",
      "white foxes"
    ]
  },
  "name": "Inari",
  "primarySources": [],
  "attributes": [],
  "id": "inari",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏙\n                Demeter\n                Greek - Grain Goddess",
      "link": "../../greek/deities/demeter.html"
    },
    {
      "type": "deity",
      "name": "🏳\n                Ceres\n                Roman - Agriculture",
      "link": "../../roman/deities/ceres.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Osiris\n                Egyptian - Fertility God",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "🐉\n                Houji\n                Chinese - Grain God",
      "link": "../../chinese/deities/houji.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Brigid\n                Celtic - Fertility Goddess",
      "link": "../../celtic/deities/brigid.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: izanagi</summary>

```json
{
  "epithets": [
    "Izanagi-no-Mikoto (伊邪那岐命) - \"He Who Invites\"",
    "Izanagi-no-Kami",
    "Izanaki-no-Mikoto (Kojiki variant)",
    "\"Iza\" (invite) + \"nagi\" (male) - the inviting/beckoning male deity",
    "Progenitor of the Kami",
    "Creator of the Islands",
    "Father of the Sun",
    "First Purifier",
    "Opener of the Celestial Door"
  ],
  "displayName": "Izanagi-no-Mikoto (伊邪那岐命)",
  "description": "The Male Who Invites - Progenitor of the Gods",
  "domains": [
    "Creation",
    "life",
    "masculinity",
    "purification",
    "the heavens",
    "the boundary between life and death"
  ],
  "title": "Japanese - Izanagi",
  "symbols": [
    "Ama-no-Nuboko (Heavenly Jeweled Spear)",
    "water/rivers (purification)",
    "creation pillars",
    "Ama-no-Nuboko (jeweled spear)",
    "Totsuka-no-Tsurugi (Ten-Span Sword)",
    "Yomotsu-Hirasaka boulder",
    "Salt water",
    "fresh water",
    "fire (through Kagutsuchi's birth)",
    "peaches (ward against evil)",
    "Onogoro Island (first land)",
    "Awaji Island",
    "Tachibana River mouth (purification site)"
  ],
  "mythology": "japanese",
  "relationships": {
    "children": [
      "with izanami: the isl",
      "s of japan",
      "countless kami of nature",
      "tsukuyomi (right eye)",
      "partner in creation"
    ],
    "consort": "izanami-no-mikoto - \"she who invites"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "with izanami: the isl",
        "s of japan",
        "countless kami of nature",
        "tsukuyomi (right eye)",
        "partner in creation"
      ],
      "consort": "izanami-no-mikoto - \"she who invites"
    },
    "epithets": [
      "Izanagi-no-Mikoto (伊邪那岐命) - \"He Who Invites\"",
      "Izanagi-no-Kami",
      "Izanaki-no-Mikoto (Kojiki variant)",
      "\"Iza\" (invite) + \"nagi\" (male) - the inviting/beckoning male deity",
      "Progenitor of the Kami",
      "Creator of the Islands",
      "Father of the Sun",
      "First Purifier",
      "Opener of the Celestial Door"
    ],
    "archetypes": [],
    "displayName": "Izanagi-no-Mikoto (伊邪那岐命)",
    "domains": [
      "Creation",
      "life",
      "masculinity",
      "purification",
      "the heavens",
      "the boundary between life and death"
    ],
    "attributes": [],
    "symbols": [
      "Ama-no-Nuboko (Heavenly Jeweled Spear)",
      "water/rivers (purification)",
      "creation pillars",
      "Ama-no-Nuboko (jeweled spear)",
      "Totsuka-no-Tsurugi (Ten-Span Sword)",
      "Yomotsu-Hirasaka boulder",
      "Salt water",
      "fresh water",
      "fire (through Kagutsuchi's birth)",
      "peaches (ward against evil)",
      "Onogoro Island (first land)",
      "Awaji Island",
      "Tachibana River mouth (purification site)"
    ]
  },
  "name": "Izanagi",
  "primarySources": [],
  "attributes": [],
  "id": "izanagi",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🕉️\n                Brahma\n                Hindu - Creator",
      "link": "../../hindu/deities/brahma.html"
    },
    {
      "type": "deity",
      "name": "🌎\n                Ptah\n                Egyptian - Creator",
      "link": "../../egyptian/deities/ptah.html"
    },
    {
      "type": "deity",
      "name": "🌍\n                Uranus\n                Greek - Sky Father",
      "link": "../../greek/deities/uranus.html"
    },
    {
      "type": "deity",
      "name": "☯️\n                Odin\n                Norse - All-Father",
      "link": "../../norse/deities/odin.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: izanami</summary>

```json
{
  "epithets": [
    "Izanami-no-Mikoto (伊邪那美命) - \"She Who Invites\"",
    "Izanami-no-Kami",
    "Yomotsu-Okami (Great Goddess of Yomi)",
    "Chishiki-no-Okami",
    "\"Iza\" (invite) + \"nami\" (female) - the inviting/beckoning female deity",
    "Mother of the Islands",
    "First Death",
    "Queen of Yomi",
    "She of the Eight Thunder Gods",
    "The Polluted One",
    "Goddess of Creation and Destruction"
  ],
  "displayName": "Izanami-no-Mikoto (伊邪那美命)",
  "description": "She Who Invites - Mother of Creation, Queen of the Dead",
  "domains": [
    "Creation",
    "femininity",
    "birth",
    "the earth",
    "islands",
    "nature kami",
    "Death",
    "the underworld (Yomi)",
    "decay",
    "endings",
    "the boundary between worlds"
  ],
  "title": "Japanese - Izanami",
  "symbols": [
    "The underworld",
    "decaying things",
    "the boulder sealing Yomi",
    "birth/death duality",
    "Serpents (underworld associations)",
    "eight thunder-beasts born from her corpse"
  ],
  "mythology": "japanese",
  "relationships": {
    "children": [
      "with izanagi: the isl",
      "s of japan",
      "countless nature kami",
      "loss",
      "horror"
    ],
    "consort": "(former): izanagi-no-mikoto - \"he who invites"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "with izanagi: the isl",
        "s of japan",
        "countless nature kami",
        "loss",
        "horror"
      ],
      "consort": "(former): izanagi-no-mikoto - \"he who invites"
    },
    "epithets": [
      "Izanami-no-Mikoto (伊邪那美命) - \"She Who Invites\"",
      "Izanami-no-Kami",
      "Yomotsu-Okami (Great Goddess of Yomi)",
      "Chishiki-no-Okami",
      "\"Iza\" (invite) + \"nami\" (female) - the inviting/beckoning female deity",
      "Mother of the Islands",
      "First Death",
      "Queen of Yomi",
      "She of the Eight Thunder Gods",
      "The Polluted One",
      "Goddess of Creation and Destruction"
    ],
    "archetypes": [],
    "displayName": "Izanami-no-Mikoto (伊邪那美命)",
    "domains": [
      "Creation",
      "femininity",
      "birth",
      "the earth",
      "islands",
      "nature kami",
      "Death",
      "the underworld (Yomi)",
      "decay",
      "endings",
      "the boundary between worlds"
    ],
    "attributes": [],
    "symbols": [
      "The underworld",
      "decaying things",
      "the boulder sealing Yomi",
      "birth/death duality",
      "Serpents (underworld associations)",
      "eight thunder-beasts born from her corpse"
    ]
  },
  "name": "Izanami",
  "primarySources": [],
  "attributes": [],
  "id": "izanami",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🌿\n                Persephone\n                Greek - Queen of Underworld",
      "link": "../../greek/deities/persephone.html"
    },
    {
      "type": "deity",
      "name": "🌉\n                Ereshkigal\n                Mesopotamian - Death",
      "link": "../../sumerian/deities/ereshkigal.html"
    },
    {
      "type": "deity",
      "name": "☯️\n                Hel\n                Norse - Underworld",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Kali\n                Hindu - Death/Creation",
      "link": "../../hindu/deities/kali.html"
    },
    {
      "type": "deity",
      "name": "🌎\n                Gaia\n                Greek - Earth Mother",
      "link": "../../greek/deities/gaia.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: susanoo</summary>

```json
{
  "epithets": [
    "Susanoo-no-Mikoto (素戒鳴尊) - \"His Swift Impetuous Male Augustness\"",
    "Take-haya-Susanoo (建速須佐之男) - \"Brave Swift Susanoo\"",
    "Susa-no-O",
    "Storm Lord",
    "Sea Prince",
    "Dragon Slayer",
    "Lord of Yomi's Edge",
    "The Impetuous One",
    "Gozu Tenno (Ox-Head Heavenly King) - syncretic Buddhist title",
    "Protector against Plague"
  ],
  "displayName": "Susanoo-no-Mikoto (素戒鳴尊)",
  "description": "The Tempestuous God of Storms and Sea",
  "domains": [
    "Storms",
    "sea",
    "wind",
    "thunder",
    "warfare",
    "agriculture (rain for crops)",
    "love",
    "marriage",
    "protection from disease"
  ],
  "title": "Japanese - Susanoo",
  "symbols": [
    "Sword (especially Kusanagi)",
    "storm clouds",
    "serpents/dragons",
    "shimenawa rope",
    "wild boar",
    "Serpent/Dragon (Yamata-no-Orochi connection)",
    "Horse (flayed horse myth)",
    "Wild Boar",
    "Chinowa (cogon grass rings used in purification)",
    "Susuki (pampas grass)",
    "Bamboo",
    "Totsuka-no-Tsurugi (Ten-Span Sword)",
    "discoverer of Kusanagi-no-Tsurugi"
  ],
  "mythology": "japanese",
  "relationships": {
    "mother": "izanami-no-mikoto (spiritually",
    "children": [
      "yashimajinumi-no-kami",
      "suseri-hime (who married okuninushi)",
      "sibling"
    ],
    "consort": "kushinadahime (the princess he saved from orochi)",
    "father": "izanagi-no-mikoto - born from his nose during purification"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "izanami-no-mikoto (spiritually",
      "children": [
        "yashimajinumi-no-kami",
        "suseri-hime (who married okuninushi)",
        "sibling"
      ],
      "consort": "kushinadahime (the princess he saved from orochi)",
      "father": "izanagi-no-mikoto - born from his nose during purification"
    },
    "epithets": [
      "Susanoo-no-Mikoto (素戒鳴尊) - \"His Swift Impetuous Male Augustness\"",
      "Take-haya-Susanoo (建速須佐之男) - \"Brave Swift Susanoo\"",
      "Susa-no-O",
      "Storm Lord",
      "Sea Prince",
      "Dragon Slayer",
      "Lord of Yomi's Edge",
      "The Impetuous One",
      "Gozu Tenno (Ox-Head Heavenly King) - syncretic Buddhist title",
      "Protector against Plague"
    ],
    "archetypes": [],
    "displayName": "Susanoo-no-Mikoto (素戒鳴尊)",
    "domains": [
      "Storms",
      "sea",
      "wind",
      "thunder",
      "warfare",
      "agriculture (rain for crops)",
      "love",
      "marriage",
      "protection from disease"
    ],
    "attributes": [],
    "symbols": [
      "Sword (especially Kusanagi)",
      "storm clouds",
      "serpents/dragons",
      "shimenawa rope",
      "wild boar",
      "Serpent/Dragon (Yamata-no-Orochi connection)",
      "Horse (flayed horse myth)",
      "Wild Boar",
      "Chinowa (cogon grass rings used in purification)",
      "Susuki (pampas grass)",
      "Bamboo",
      "Totsuka-no-Tsurugi (Ten-Span Sword)",
      "discoverer of Kusanagi-no-Tsurugi"
    ]
  },
  "name": "Susanoo",
  "primarySources": [],
  "attributes": [],
  "id": "susanoo",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "⚡\n                Thor\n                Norse - Thunder God",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Indra\n                Hindu - Storm God",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "🌊\n                Poseidon\n                Greek - Sea God",
      "link": "../../greek/deities/poseidon.html"
    },
    {
      "type": "deity",
      "name": "🌎\n                Set\n                Egyptian - Chaos God",
      "link": "../../egyptian/deities/set.html"
    }
  ]
}
```

</details>

---

### `mayan` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: ah-puch</summary>

```json
{
  "epithets": [
    "Ah Puch",
    "Ah Pukuh",
    "Kisin (\"Stinking One\")",
    "Yum Kimil (\"Lord of Death\")",
    "Hun Ahau (\"One Lord\")"
  ],
  "displayName": "💀 Ah Puch",
  "description": "Ah Pukuh - \"The Destroyer\" / \"The Fleshless One\"",
  "domains": [
    "Xibalba - The Place of Fear (underworld)",
    "Death",
    "the underworld",
    "decay",
    "disease",
    "darkness",
    "misfortune",
    "the ninth level of Xibalba"
  ],
  "title": "Maya - Ah Puch",
  "symbols": [
    "Skull",
    "bones",
    "owl",
    "percentage sign (death eye)",
    "corpse",
    "decay spots",
    "bells",
    "Owl (death messenger)",
    "dog (guide to underworld)",
    "jaguar",
    "vulture",
    "bat",
    "A skeletal figure with exposed ribs",
    "vertebrae",
    "and a distended belly representing decay; often shown with death spots on the body"
  ],
  "mythology": "mayan",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Ah Puch",
      "Ah Pukuh",
      "Kisin (\"Stinking One\")",
      "Yum Kimil (\"Lord of Death\")",
      "Hun Ahau (\"One Lord\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Xibalba - The Place of Fear (underworld)",
      "Death",
      "the underworld",
      "decay",
      "disease",
      "darkness",
      "misfortune",
      "the ninth level of Xibalba"
    ],
    "attributes": [],
    "symbols": [
      "Skull",
      "bones",
      "owl",
      "percentage sign (death eye)",
      "corpse",
      "decay spots",
      "bells",
      "Owl (death messenger)",
      "dog (guide to underworld)",
      "jaguar",
      "vulture",
      "bat",
      "A skeletal figure with exposed ribs",
      "vertebrae",
      "and a distended belly representing decay; often shown with death spots on the body"
    ]
  },
  "name": "Ah Puch",
  "primarySources": [],
  "attributes": [],
  "id": "ah-puch",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇪\n                        Hades\n                        Greek",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Osiris\n                        Egyptian",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Hel\n                        Norse",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Yama\n                        Hindu",
      "link": "../../hindu/deities/yama.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: chaac</summary>

```json
{
  "epithets": [
    "Chaahk / Chaac / Chac",
    "\"Lord of the Waters",
    "\" \"He Who Splits the Sky\"",
    "Associated with water and preciousness",
    "often shown with jade ear spools and pectorals"
  ],
  "displayName": "🌧 Chaac",
  "description": "Chaahk - \"Thunder\" / \"Lightning Strike\"",
  "domains": [
    "Rain",
    "thunder",
    "lightning",
    "fertility",
    "agriculture",
    "water",
    "cenotes",
    "caves"
  ],
  "title": "Maya - Chaac",
  "symbols": [
    "Lightning axe",
    "jade",
    "water lily",
    "shell",
    "serpent",
    "frog",
    "T-shaped element (wind/breath)",
    "Frog (rain herald)",
    "fish",
    "turtle",
    "water birds",
    "Chaac's most distinctive feature - a curved",
    "elongated nose possibly representing a lightning bolt or serpent"
  ],
  "mythology": "mayan",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Chaahk / Chaac / Chac",
      "\"Lord of the Waters",
      "\" \"He Who Splits the Sky\"",
      "Associated with water and preciousness",
      "often shown with jade ear spools and pectorals"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Rain",
      "thunder",
      "lightning",
      "fertility",
      "agriculture",
      "water",
      "cenotes",
      "caves"
    ],
    "attributes": [],
    "symbols": [
      "Lightning axe",
      "jade",
      "water lily",
      "shell",
      "serpent",
      "frog",
      "T-shaped element (wind/breath)",
      "Frog (rain herald)",
      "fish",
      "turtle",
      "water birds",
      "Chaac's most distinctive feature - a curved",
      "elongated nose possibly representing a lightning bolt or serpent"
    ]
  },
  "name": "Chaac",
  "primarySources": [],
  "attributes": [],
  "id": "chaac",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🌧\n                        \n                            Tlaloc\n                            Aztec Deity\n                            Mesoamerican parallel - goggle-eyed rain god",
      "link": "../../aztec/deities/tlaloc.html"
    },
    {
      "type": "deity",
      "name": "🌀\n                        Tlaloc\n                        Aztec",
      "link": "../../aztec/deities/tlaloc.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Zeus\n                        Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Thor\n                        Norse",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Indra\n                        Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "🌧 Tlaloc (Aztec)",
      "link": "../../aztec/deities/tlaloc.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: itzamna</summary>

```json
{
  "epithets": [
    "Itzamnaaj / Itzamna",
    "God D (scholarly designation)",
    "Zamna",
    "Yaxcocahmut",
    "\"Lord of the Heavens",
    "\" \"The One Who Receives and Possesses\""
  ],
  "displayName": "🌟 Itzamna",
  "description": "Itzamnaaj - \"Iguana House\" / \"Lizard House\"",
  "domains": [
    "Creation",
    "sky",
    "day",
    "night",
    "writing",
    "medicine",
    "learning",
    "priesthood",
    "agriculture"
  ],
  "title": "Maya - Itzamna",
  "symbols": [
    "Cosmic caiman",
    "ak'bal (darkness glyph)",
    "writing implements",
    "jade",
    "mirror",
    "royal insignia",
    "Caiman/crocodile",
    "iguana",
    "various birds including the principal bird deity",
    "An aged man with a Roman nose",
    "sunken cheeks",
    "and single tooth; often shown wearing an elaborate headdress with the Muan bird"
  ],
  "mythology": "mayan",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Itzamnaaj / Itzamna",
      "God D (scholarly designation)",
      "Zamna",
      "Yaxcocahmut",
      "\"Lord of the Heavens",
      "\" \"The One Who Receives and Possesses\""
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Creation",
      "sky",
      "day",
      "night",
      "writing",
      "medicine",
      "learning",
      "priesthood",
      "agriculture"
    ],
    "attributes": [],
    "symbols": [
      "Cosmic caiman",
      "ak'bal (darkness glyph)",
      "writing implements",
      "jade",
      "mirror",
      "royal insignia",
      "Caiman/crocodile",
      "iguana",
      "various birds including the principal bird deity",
      "An aged man with a Roman nose",
      "sunken cheeks",
      "and single tooth; often shown wearing an elaborate headdress with the Muan bird"
    ]
  },
  "name": "Itzamna",
  "primarySources": [],
  "attributes": [],
  "id": "itzamna",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "☥\n                        Thoth\n                        Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Zeus\n                        Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🕎\n                        Brahma\n                        Hindu",
      "link": "../../hindu/deities/brahma.html"
    },
    {
      "type": "deity",
      "name": "🌀\n                        Quetzalcoatl\n                        Aztec",
      "link": "../../aztec/deities/quetzalcoatl.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: ixchel</summary>

```json
{
  "epithets": [
    "Ix Chel / Ixchel",
    "Goddess I",
    "Goddess O (scholarly designations)",
    "Chak Chel (Red/Great Rainbow)"
  ],
  "displayName": "🌙 Ixchel",
  "description": "Ix Chel - \"Lady Rainbow\" / \"She of the Rainbow\"",
  "domains": [
    "Moon",
    "childbirth",
    "fertility",
    "medicine",
    "weaving",
    "water",
    "floods",
    "sexuality",
    "divination"
  ],
  "title": "Maya - Ixchel",
  "symbols": [
    "Moon",
    "rainbow",
    "rabbit",
    "jade",
    "weaving implements (spindle",
    "loom)",
    "water jars",
    "serpents",
    "Rabbit (seen in the moon)",
    "serpent",
    "jaguar",
    "spider (weaving)",
    "Cozumel Island (Isla de las Mujeres - \"Island of Women\")",
    "Beautiful woman with long hair",
    "bare breasts",
    "holding or accompanied by a rabbit; lunar crescent associations"
  ],
  "mythology": "mayan",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Ix Chel / Ixchel",
      "Goddess I",
      "Goddess O (scholarly designations)",
      "Chak Chel (Red/Great Rainbow)"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Moon",
      "childbirth",
      "fertility",
      "medicine",
      "weaving",
      "water",
      "floods",
      "sexuality",
      "divination"
    ],
    "attributes": [],
    "symbols": [
      "Moon",
      "rainbow",
      "rabbit",
      "jade",
      "weaving implements (spindle",
      "loom)",
      "water jars",
      "serpents",
      "Rabbit (seen in the moon)",
      "serpent",
      "jaguar",
      "spider (weaving)",
      "Cozumel Island (Isla de las Mujeres - \"Island of Women\")",
      "Beautiful woman with long hair",
      "bare breasts",
      "holding or accompanied by a rabbit; lunar crescent associations"
    ]
  },
  "name": "Ixchel",
  "primarySources": [],
  "attributes": [],
  "id": "ixchel",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "👾\n                        \n                            Coatlicue\n                            Aztec Deity\n                            Aztec Earth Mother with dual aspects",
      "link": "../../aztec/deities/coatlicue.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Isis\n                        Egyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Artemis\n                        Greek",
      "link": "../../greek/deities/artemis.html"
    },
    {
      "type": "deity",
      "name": "🌀\n                        Coatlicue\n                        Aztec",
      "link": "../../aztec/deities/coatlicue.html"
    },
    {
      "type": "deity",
      "name": "👾 Coatlicue (Aztec)",
      "link": "../../aztec/deities/coatlicue.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: kukulkan</summary>

```json
{
  "epithets": [
    "K'uk'ulkan",
    "Q'uq'umatz / Gucumatz (\"Quetzal Serpent\")"
  ],
  "displayName": "🐍 Kukulkan",
  "description": "K'uk'ulkan - \"Feathered Serpent\" / \"Quetzal-Serpent\"",
  "domains": [
    "Wind",
    "learning",
    "knowledge",
    "creation",
    "the calendar",
    "Venus",
    "civilization",
    "crafts"
  ],
  "title": "Maya - Kukulkan",
  "symbols": [
    "Feathered serpent",
    "quetzal plumes",
    "jade",
    "Venus glyph",
    "wind shell",
    "step-fret patterns",
    "Quetzal bird (resplendent quetzal)",
    "rattlesnake",
    "butterfly",
    "A great serpent covered in brilliant green quetzal plumes",
    "sometimes shown with a human face emerging from the serpent's jaws",
    "Connected to Venus as the morning star",
    "his appearances and disappearances tracked in Maya astronomical tables"
  ],
  "mythology": "mayan",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "K'uk'ulkan",
      "Q'uq'umatz / Gucumatz (\"Quetzal Serpent\")"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Wind",
      "learning",
      "knowledge",
      "creation",
      "the calendar",
      "Venus",
      "civilization",
      "crafts"
    ],
    "attributes": [],
    "symbols": [
      "Feathered serpent",
      "quetzal plumes",
      "jade",
      "Venus glyph",
      "wind shell",
      "step-fret patterns",
      "Quetzal bird (resplendent quetzal)",
      "rattlesnake",
      "butterfly",
      "A great serpent covered in brilliant green quetzal plumes",
      "sometimes shown with a human face emerging from the serpent's jaws",
      "Connected to Venus as the morning star",
      "his appearances and disappearances tracked in Maya astronomical tables"
    ]
  },
  "name": "Kukulkan",
  "primarySources": [],
  "attributes": [],
  "id": "kukulkan",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🐍\n                        \n                            Quetzalcoatl\n                            Aztec Deity\n                            Direct equivalent - the Feathered Serpent of central Mexico",
      "link": "../../aztec/deities/quetzalcoatl.html"
    },
    {
      "type": "deity",
      "name": "🌀\n                        Quetzalcoatl\n                        Aztec",
      "link": "../../aztec/deities/quetzalcoatl.html"
    },
    {
      "type": "deity",
      "name": "☥\n                        Thoth\n                        Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "🇪\n                        Prometheus\n                        Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "deity",
      "name": "🛡\n                        Odin\n                        Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🐍 Quetzalcoatl (Aztec)",
      "link": "../../aztec/deities/quetzalcoatl.html"
    }
  ]
}
```

</details>

---

### `mythologies` Schema

#### Schema Variation 1

**Fields:**
- `description` (string)
- `displayName` (string)
- `heroTitle` (string)
- `icon` (string)
- `id` (string)
- `metadata` (object)
- `sections` (array)
- `stats` (object)

**Sample Documents:**

<details>
<summary>Document 1: apocryphal</summary>

```json
{
  "metadata": {
    "createdAt": {
      "_seconds": 1765593875,
      "_nanoseconds": 604000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "deityCount": 0,
    "updatedAt": {
      "_seconds": 1765593875,
      "_nanoseconds": 604000000
    }
  },
  "stats": {
    "domainCount": 0,
    "archetypeCount": 0,
    "deityCount": 0
  },
  "displayName": "Apocryphal & Enochian Mythology",
  "icon": "📖✨",
  "description": "Explore the hidden wisdom of apocryphal texts and Enochian mysteries. Discover the Books of Enoch,\n                the Watchers who fell from heaven, the Nephilim giants, and the angelic hierarchies revealed to\n                the prophet Enoch. Journey through the seven heavens, learn the secret names of angels and demons,\n                and uncover the esoteric knowledge forbidden from canonical scripture. These ancient texts preserve\n                traditions of celestial rebellion, divine judgment, and secret wisdom that shaped Jewish mysticism,\n                early Christianity, and Western esotericism for millennia.",
  "heroTitle": "Hidden Wisdom of the Apocryphal & Enochian Traditions",
  "id": "apocryphal",
  "sections": [
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "cosmology",
    "general",
    "creatures",
    "general",
    "texts",
    "general",
    "general",
    "general",
    "cosmology",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "cosmology",
    "general"
  ]
}
```

</details>

<details>
<summary>Document 2: aztec</summary>

```json
{
  "metadata": {
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 154000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "deityCount": 5,
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 154000000
    }
  },
  "stats": {
    "domainCount": 44,
    "archetypeCount": 0,
    "deityCount": 5
  },
  "displayName": "Aztec Mythology - World Mythos",
  "icon": "",
  "description": "",
  "heroTitle": "The Mexica Cosmos",
  "id": "aztec",
  "sections": [
    "general",
    "general",
    "deities",
    "general",
    "general",
    "general",
    "general"
  ]
}
```

</details>

<details>
<summary>Document 3: babylonian</summary>

```json
{
  "metadata": {
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 360000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "deityCount": 8,
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 360000000
    }
  },
  "stats": {
    "domainCount": 60,
    "archetypeCount": 0,
    "deityCount": 8
  },
  "displayName": "Babylonian Mythology",
  "icon": "",
  "description": "",
  "heroTitle": "The Tradition of Cosmic Order and Divine Kingship",
  "id": "babylonian",
  "sections": [
    "general",
    "pantheon",
    "deities",
    "cosmology",
    "general",
    "general",
    "general",
    "general",
    "heroes",
    "creatures",
    "herbs",
    "rituals",
    "magic",
    "texts",
    "general",
    "symbols",
    "rituals",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general"
  ]
}
```

</details>

<details>
<summary>Document 4: buddhist</summary>

```json
{
  "metadata": {
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 725000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "deityCount": 8,
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 725000000
    }
  },
  "stats": {
    "domainCount": 6,
    "archetypeCount": 0,
    "deityCount": 8
  },
  "displayName": "Buddhist Mythology - Buddhist Mythology",
  "icon": "",
  "description": "Explore the profound wisdom of Buddhist cosmology, from the enlightenment of the Buddha to the\n                compassionate Bodhisattvas, from the 31 realms of existence to the eternal cycle of rebirth.\n                Discover the path to liberation from suffering and the realization of ultimate truth.",
  "heroTitle": "The Path to Enlightenment & the Wheel of Dharma",
  "id": "buddhist",
  "sections": [
    "spiritual_path",
    "general",
    "general",
    "cosmology",
    "cosmology",
    "general",
    "general",
    "general",
    "general",
    "creatures",
    "general",
    "herbs",
    "herbs",
    "rituals",
    "rituals",
    "general",
    "rituals",
    "general",
    "texts",
    "symbols",
    "general",
    "general",
    "herbs",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general"
  ]
}
```

</details>

<details>
<summary>Document 5: celtic</summary>

```json
{
  "metadata": {
    "createdAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 993000000
    },
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "deityCount": 10,
    "updatedAt": {
      "_seconds": 1765593876,
      "_nanoseconds": 993000000
    }
  },
  "stats": {
    "domainCount": 126,
    "archetypeCount": 0,
    "deityCount": 10
  },
  "displayName": "Celtic Mythology - Mythos Explorer",
  "icon": "",
  "description": "",
  "heroTitle": "",
  "id": "celtic",
  "sections": [
    "general",
    "general",
    "cosmology",
    "herbs",
    "rituals",
    "spiritual_path",
    "heroes",
    "deities",
    "deities",
    "general",
    "general",
    "general",
    "general",
    "general",
    "general",
    "texts",
    "general",
    "herbs"
  ]
}
```

</details>

---

### `norse` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: baldr</summary>

```json
{
  "epithets": [
    "The Beautiful",
    "The Shining One",
    "The Good"
  ],
  "displayName": "🌟 Baldr",
  "description": "God of Light, Beauty, and Purity",
  "domains": [
    "The Beautiful",
    "The Shining One",
    "The Good",
    "Light",
    "beauty",
    "purity",
    "goodness",
    "joy",
    "peace"
  ],
  "title": "Norse - Baldr",
  "symbols": [
    "Mistletoe",
    "light",
    "ships",
    "white flowers"
  ],
  "mythology": "norse",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "The Beautiful",
      "The Shining One",
      "The Good"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "The Beautiful",
      "The Shining One",
      "The Good",
      "Light",
      "beauty",
      "purity",
      "goodness",
      "joy",
      "peace"
    ],
    "attributes": [],
    "symbols": [
      "Mistletoe",
      "light",
      "ships",
      "white flowers"
    ]
  },
  "name": "Baldr",
  "primarySources": [
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Son of Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Loki",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "Ragnarok",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=ragnarok"
    },
    {
      "term": "The Beautiful",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "The Shining One",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "The Good",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Loki",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Ragnarok",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=ragnarok"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    }
  ],
  "attributes": [],
  "id": "baldr",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "🔥\n                    Prophecy\n                \n                \n                    Ragnarok\n                    His death triggers the path to the end",
      "link": "../cosmology/ragnarok.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Osiris\n                Egyptian",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "cosmology",
      "name": "🔥 Ragnarok",
      "link": "../cosmology/ragnarok.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: eir</summary>

```json
{
  "epithets": [],
  "displayName": "💉 Eir",
  "description": "Goddess of Healing",
  "domains": [],
  "title": "Eir - Norse Mythology",
  "symbols": [],
  "mythology": "norse",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Norse Mythology",
  "primarySources": [
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    }
  ],
  "attributes": [],
  "id": "eir",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "☘️\n                Brigid\n                Celtic",
      "link": "../../celtic/deities/brigid.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Dhanvantari\n                Hindu",
      "link": "../../hindu/deities/dhanvantari.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Sekhmet\n                Egyptian",
      "link": "../../egyptian/deities/sekhmet.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: freya</summary>

```json
{
  "epithets": [
    "Lady (Freyja means \"Lady\")",
    "Vanadís (Vanir Goddess)",
    "Mardöll (Sea-Bright)",
    "Gefn (Giver)",
    "Hörn (Flax)"
  ],
  "displayName": "Freyja (Freya)",
  "description": "Goddess of Love, Beauty, Fertility, and Magic",
  "domains": [
    "Lady (Freyja means \"Lady\")",
    "Vanadís (Vanir Goddess)",
    "Mardöll (Sea-Bright)",
    "Gefn (Giver)",
    "Hörn (Flax)",
    "Love",
    "beauty",
    "fertility",
    "sex",
    "war",
    "death",
    "magic (seidr)",
    "gold",
    "prophecy",
    "cats",
    "falcons"
  ],
  "title": "Norse - Freya",
  "symbols": [
    "Necklace Brísingamen",
    "falcon cloak (allows flight)",
    "boar Hildisvíni",
    "her chariot pulled by cats",
    "Cats (pull her chariot)",
    "falcon (her cloak)",
    "swine in general",
    "Elder tree",
    "Mugwort",
    "roses",
    "flax",
    "primrose"
  ],
  "mythology": "norse",
  "relationships": {
    "mother": "unnamed (possibly nerthus)",
    "children": [
      "hnoss",
      "gersemi (daughters)",
      "god of fertility",
      "the vanir tribe",
      "völvas",
      "loki (complex relationship - he both aids",
      "antagonizes her)"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "unnamed (possibly nerthus)",
      "children": [
        "hnoss",
        "gersemi (daughters)",
        "god of fertility",
        "the vanir tribe",
        "völvas",
        "loki (complex relationship - he both aids",
        "antagonizes her)"
      ]
    },
    "epithets": [
      "Lady (Freyja means \"Lady\")",
      "Vanadís (Vanir Goddess)",
      "Mardöll (Sea-Bright)",
      "Gefn (Giver)",
      "Hörn (Flax)"
    ],
    "archetypes": [],
    "displayName": "Freyja (Freya)",
    "domains": [
      "Lady (Freyja means \"Lady\")",
      "Vanadís (Vanir Goddess)",
      "Mardöll (Sea-Bright)",
      "Gefn (Giver)",
      "Hörn (Flax)",
      "Love",
      "beauty",
      "fertility",
      "sex",
      "war",
      "death",
      "magic (seidr)",
      "gold",
      "prophecy",
      "cats",
      "falcons"
    ],
    "attributes": [],
    "symbols": [
      "Necklace Brísingamen",
      "falcon cloak (allows flight)",
      "boar Hildisvíni",
      "her chariot pulled by cats",
      "Cats (pull her chariot)",
      "falcon (her cloak)",
      "swine in general",
      "Elder tree",
      "Mugwort",
      "roses",
      "flax",
      "primrose"
    ]
  },
  "name": "Freya",
  "primarySources": [
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freya",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=attributes"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Vanadís",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Mardöll",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Gefn",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Hörn",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "seidr",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=seidr"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Asgard",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Key Myths",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=key-myths"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "The Beautiful",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Loki",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Asgard",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Loki",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Norse tradition",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=norse-tradition"
    },
    {
      "term": "seidr",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=seidr"
    },
    {
      "term": "other",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=other"
    },
    {
      "term": "enemies",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=enemies"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Valhalla",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=valhalla"
    },
    {
      "term": "Hall of the Slain",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=valhalla"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Valhalla",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=valhalla"
    },
    {
      "term": "Valhalla",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=valhalla"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Allfather",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Ragnarok",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=ragnarok"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Relationships",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=relationships"
    },
    {
      "term": "Njord",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=njord"
    },
    {
      "term": "Odin",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Enemies",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=enemies"
    },
    {
      "term": "Freyr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyr"
    },
    {
      "term": "Loki",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "seidr",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=seidr"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "deities",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=deities"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred-sites"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=offerings"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyr"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=offerings"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Thor",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=thor"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Invocations",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=invocations"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "prayers",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=prayers"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "seidr",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=seidr"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    }
  ],
  "attributes": [],
  "id": "freya",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Aphrodite\n                Greek - Love",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Venus\n                Roman - Love",
      "link": "../../roman/deities/venus.html"
    },
    {
      "type": "deity",
      "name": "🌙\n                Inanna\n                Sumerian - Love & War",
      "link": "../../sumerian/deities/inanna.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Hathor\n                Egyptian - Beauty",
      "link": "../../egyptian/deities/hathor.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Morrigan\n                Celtic - War Magic",
      "link": "../../celtic/deities/morrigan.html"
    },
    {
      "type": "cosmology",
      "name": "⚔️ Norse Afterlife",
      "link": "../cosmology/afterlife.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: freyja</summary>

```json
{
  "epithets": [],
  "displayName": "💎 Freyja",
  "description": "Goddess of Love, Beauty, Fertility, and Magic",
  "domains": [],
  "title": "Norse - Freyja",
  "symbols": [],
  "mythology": "norse",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Freyja",
  "primarySources": [
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Valhalla",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=valhalla"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Asgard",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    }
  ],
  "attributes": [],
  "id": "freyja",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Aphrodite\n                Greek - Love",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "🌙\n                Inanna\n                Sumerian - Love & War",
      "link": "../../sumerian/deities/inanna.html"
    },
    {
      "type": "deity",
      "name": "☀️\n                Hathor\n                Egyptian - Beauty",
      "link": "../../egyptian/deities/hathor.html"
    },
    {
      "type": "cosmology",
      "name": "⚔️ Norse Afterlife",
      "link": "../cosmology/afterlife.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: frigg</summary>

```json
{
  "epithets": [
    "Queen of Asgard",
    "First of the Asynjur",
    "Lady of Fensalir",
    "Mistress of Foresight"
  ],
  "displayName": "👸 Frigg",
  "description": "Queen of Asgard, Goddess of Marriage and Motherhood",
  "domains": [
    "Queen of Asgard",
    "First of the Asynjur",
    "Lady of Fensalir",
    "Mistress of Foresight",
    "Marriage",
    "motherhood",
    "domestic life",
    "prophecy",
    "foresight",
    "clouds",
    "weaving",
    "protection of families"
  ],
  "title": "Norse - Frigg",
  "symbols": [
    "Spindle",
    "distaff",
    "keys (household authority)",
    "clouds",
    "mists",
    "falcon cloak",
    "Falcon",
    "rams",
    "sheep",
    "Birch tree",
    "mistletoe (tragically)",
    "flax",
    "wool-bearing plants"
  ],
  "mythology": "norse",
  "relationships": {
    "mother": "unknown",
    "children": [
      "baldr (beloved son)",
      "hod (blind son)",
      "possibly others\nstepchildren: thor",
      "vidar",
      "vali",
      "maidens (fulla",
      "gna",
      "eir)",
      "the asynjur (goddesses)",
      "mothers",
      "those who break marriage oaths or harm families"
    ],
    "consort": "odin (husband"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "unknown",
      "children": [
        "baldr (beloved son)",
        "hod (blind son)",
        "possibly others\nstepchildren: thor",
        "vidar",
        "vali",
        "maidens (fulla",
        "gna",
        "eir)",
        "the asynjur (goddesses)",
        "mothers",
        "those who break marriage oaths or harm families"
      ],
      "consort": "odin (husband"
    },
    "epithets": [
      "Queen of Asgard",
      "First of the Asynjur",
      "Lady of Fensalir",
      "Mistress of Foresight"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Queen of Asgard",
      "First of the Asynjur",
      "Lady of Fensalir",
      "Mistress of Foresight",
      "Marriage",
      "motherhood",
      "domestic life",
      "prophecy",
      "foresight",
      "clouds",
      "weaving",
      "protection of families"
    ],
    "attributes": [],
    "symbols": [
      "Spindle",
      "distaff",
      "keys (household authority)",
      "clouds",
      "mists",
      "falcon cloak",
      "Falcon",
      "rams",
      "sheep",
      "Birch tree",
      "mistletoe (tragically)",
      "flax",
      "wool-bearing plants"
    ]
  },
  "name": "Frigg",
  "primarySources": [
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Asgard",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=attributes"
    },
    {
      "term": "Asgard",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Lady of Fensalir",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Asgard",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Key Myths",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=key-myths"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Hel",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=hel"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Deities",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=deities"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=worship"
    },
    {
      "term": "other",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=other"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Freyja",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=freyja"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Relationships",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=relationships"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "other",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=other"
    },
    {
      "term": "Enemies",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=enemies"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Baldr",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=baldur"
    },
    {
      "term": "Loki",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=loki"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=sacred-sites"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Thor",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=thor"
    },
    {
      "term": "family",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=family"
    },
    {
      "term": "Odin",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=odin"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "rituals",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=rituals"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=offerings"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Invocations",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=invocations"
    },
    {
      "term": "Frigg",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Related Concepts",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=related-concepts"
    },
    {
      "term": "Within Norse",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=within-norse"
    },
    {
      "term": "Asgard",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=asgard"
    },
    {
      "term": "Similar Deities in Other Traditions",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=similar-deities-in-other-traditions"
    },
    {
      "term": "Frigg",
      "tradition": "norse",
      "href": "../corpus-search.html?tradition=norse&term=frigg"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?tradition=norse&term=mythology"
    }
  ],
  "attributes": [],
  "id": "frigg",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Fensalir",
      "link": "../cosmology/asgard.html"
    },
    {
      "type": "deity",
      "name": "Hera (Greek)",
      "link": "../../greek/deities/hera.html"
    },
    {
      "type": "deity",
      "name": "Juno (Roman)",
      "link": "../../roman/deities/juno.html"
    },
    {
      "type": "deity",
      "name": "Isis (Egyptian)",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "cosmology",
      "name": "🏰\n                    Divine Realm\n                \n                \n                    Fensalir\n                    Her hall in Asgard",
      "link": "../cosmology/asgard.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Hera\n                Greek",
      "link": "../../greek/deities/hera.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Juno\n                Roman",
      "link": "../../roman/deities/juno.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Isis\n                Egyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "cosmology",
      "name": "🏰 Asgard",
      "link": "../cosmology/asgard.html"
    }
  ]
}
```

</details>

---

### `persian` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: ahura-mazda</summary>

```json
{
  "epithets": [
    "Wise Lord",
    "Lord of Wisdom",
    "Creator of All",
    "Uncreated Creator",
    "Spenta Mainyu"
  ],
  "displayName": "⚡ Ahura Mazda",
  "description": "The Wise Lord, Supreme Creator",
  "domains": [
    "Wise Lord",
    "Lord of Wisdom",
    "Creator of All",
    "Uncreated Creator",
    "Spenta Mainyu",
    "Wisdom",
    "Asha (Truth)",
    "Light",
    "Creation",
    "Order",
    "Goodness"
  ],
  "title": "Persian - Ahura Mazda",
  "symbols": [
    "Faravahar (winged disk)",
    "Sacred Fire",
    "Sun",
    "Light",
    "Bull (symbol of creation)",
    "White horse",
    "Eagle",
    "Cypress tree",
    "Haoma",
    "Pomegranate"
  ],
  "mythology": "persian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Wise Lord",
      "Lord of Wisdom",
      "Creator of All",
      "Uncreated Creator",
      "Spenta Mainyu"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Wise Lord",
      "Lord of Wisdom",
      "Creator of All",
      "Uncreated Creator",
      "Spenta Mainyu",
      "Wisdom",
      "Asha (Truth)",
      "Light",
      "Creation",
      "Order",
      "Goodness"
    ],
    "attributes": [],
    "symbols": [
      "Faravahar (winged disk)",
      "Sacred Fire",
      "Sun",
      "Light",
      "Bull (symbol of creation)",
      "White horse",
      "Eagle",
      "Cypress tree",
      "Haoma",
      "Pomegranate"
    ]
  },
  "name": "Ahura Mazda",
  "primarySources": [
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wise Lord",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wise Lord",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Lord of Wisdom",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "White Horse",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Renovation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zoroaster",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Prophet",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zarathustra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zoroaster",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Primary Sources",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Thought",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "World",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohuman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic Order",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Desirable Dominion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Holy Devotion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Perfection",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Health",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Justice",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Obedience",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Primary",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Destructive Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Daevas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Atash",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Bahram",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred Fire",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Atash",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Prayers",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wise Lord",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Within Persian Tradition",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Renovation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cross Cultural Parallels",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Historical",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wise Lord",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    }
  ],
  "attributes": [],
  "id": "ahura-mazda",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Threefold Path",
      "link": "../cosmology/threefold-path.html"
    },
    {
      "type": "cosmology",
      "name": "Chinvat Bridge",
      "link": "../cosmology/chinvat-bridge.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "deity",
      "name": "☪️\n                Allah\n                Islamic",
      "link": "../../islamic/deities/allah.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Atum\n                Egyptian",
      "link": "../../egyptian/deities/atum.html"
    },
    {
      "type": "hero",
      "name": "🔥 Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "⚖️ Asha (Truth)",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "🌟 Frashokereti",
      "link": "../cosmology/frashokereti.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: amesha-spentas</summary>

```json
{
  "epithets": [],
  "displayName": "✨ Amesha Spentas",
  "description": "The Bounteous Immortals",
  "domains": [],
  "title": "Amesha Spentas - Persian Mythology",
  "symbols": [],
  "mythology": "persian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Persian Mythology",
  "primarySources": [
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Bahman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Bahman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic Order",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Justice",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Druj",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic Order",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Justice",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khshathra Vairya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Desirable Dominion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khshathra Vairya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Daevas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Armaiti",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Holy Devotion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Armaiti",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khordad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Perfection",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Health",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Perfection",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khordad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Health",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Eternal Life",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Health",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amordad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Eternal Life",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amordad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Eternal Life",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Perfection",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Primary Sources",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Perfection",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mazda Ahura",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Purpose",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohuman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ardwahisht",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Shahrewar",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Desirable Dominion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Holy Devotion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Hordad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amurdad",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immortality",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Final Restoration",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "World",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khshathra Vairya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Armaiti",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Druj",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khshathra Vairya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Armaiti",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Khshathra Vairya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Armaiti",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ameretat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Asha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Renovation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cross Cultural Parallels",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    }
  ],
  "attributes": [],
  "id": "amesha-spentas",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Chinvat Bridge",
      "link": "../cosmology/chinvat-bridge.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "🏺\n                Ennead\n                Egyptian",
      "link": "../../egyptian/cosmology/ennead.html"
    },
    {
      "type": "cosmology",
      "name": "✨ Asha (Truth)",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "🌑 Druj (Lie)",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "🌟 Frashokereti",
      "link": "../cosmology/frashokereti.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: anahita</summary>

```json
{
  "epithets": [
    "Lady of the Waters",
    "The Immaculate One",
    "Strong and Holy",
    "Mother of Life"
  ],
  "displayName": "Anahita (Aredvi Sura Anahita)",
  "description": "Goddess of Waters, Fertility, and Healing",
  "domains": [
    "Lady of the Waters",
    "The Immaculate One",
    "Strong and Holy",
    "Mother of Life",
    "Waters",
    "Fertility",
    "Healing",
    "Purification",
    "Abundance",
    "Childbirth",
    "Victory"
  ],
  "title": "Persian - Anahita",
  "symbols": [
    "Flowing water",
    "Golden vessel/jug",
    "Lotus",
    "Eight-pointed star",
    "Dove",
    "Horse (white)",
    "Beaver",
    "Fish",
    "Swan",
    "Rose",
    "Pomegranate",
    "Water lily",
    "Myrtle"
  ],
  "mythology": "persian",
  "relationships": {
    "children": [
      "especially haurvatat (wholeness/health",
      "mithra (covenant",
      "light)",
      "tishtrya (star deity of rain)",
      "especially those causing drought",
      "disease",
      "infertility; apaosha (demon of drought)"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "especially haurvatat (wholeness/health",
        "mithra (covenant",
        "light)",
        "tishtrya (star deity of rain)",
        "especially those causing drought",
        "disease",
        "infertility; apaosha (demon of drought)"
      ]
    },
    "epithets": [
      "Lady of the Waters",
      "The Immaculate One",
      "Strong and Holy",
      "Mother of Life"
    ],
    "archetypes": [],
    "displayName": "Anahita (Aredvi Sura Anahita)",
    "domains": [
      "Lady of the Waters",
      "The Immaculate One",
      "Strong and Holy",
      "Mother of Life",
      "Waters",
      "Fertility",
      "Healing",
      "Purification",
      "Abundance",
      "Childbirth",
      "Victory"
    ],
    "attributes": [],
    "symbols": [
      "Flowing water",
      "Golden vessel/jug",
      "Lotus",
      "Eight-pointed star",
      "Dove",
      "Horse (white)",
      "Beaver",
      "Fish",
      "Swan",
      "Rose",
      "Pomegranate",
      "Water lily",
      "Myrtle"
    ]
  },
  "name": "Anahita",
  "primarySources": [
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Aredvi Sura",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Divine",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Lady of the Waters",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Immaculate One",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Goddess of Fertility",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Persian",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zarathustra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Prophet",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zarathustra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Persian",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Nature",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mithra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Haurvatat",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Wholeness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Health",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Amesha Spentas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mithra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Tishtrya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Daevas",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Apaosha",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Persian",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sources",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Prayers",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Tishtrya",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Other",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Prayers",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Lady of the Waters",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Aredvi Sura",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Significance",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Persian",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Nature",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Worship",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Anahita",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    }
  ],
  "attributes": [],
  "id": "anahita",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Isis",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Ishtar\n                Mesopotamian",
      "link": "../../babylonian/deities/ishtar.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Aphrodite\n                Greek",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Saraswati\n                Hindu",
      "link": "../../hindu/deities/saraswati.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Isis\n                Egyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Venus\n                Roman",
      "link": "../../roman/deities/venus.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Creation",
      "link": "../cosmology/creation.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: angra-mainyu</summary>

```json
{
  "epithets": [
    "Destructive Spirit",
    "Ahriman",
    "Adversary",
    "Father of Lies",
    "Lord of Darkness"
  ],
  "displayName": "🔥 Angra Mainyu (Ahriman)",
  "description": "The Destructive Spirit, Lord of Darkness",
  "domains": [
    "Destructive Spirit",
    "Ahriman",
    "Adversary",
    "Father of Lies",
    "Lord of Darkness",
    "Druj (Lie)",
    "Darkness",
    "Death",
    "Disease",
    "Chaos",
    "Destruction"
  ],
  "title": "Persian - Angra Mainyu",
  "symbols": [
    "Serpent",
    "Darkness",
    "Scorpion",
    "Winter",
    "Drought"
  ],
  "mythology": "persian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Destructive Spirit",
      "Ahriman",
      "Adversary",
      "Father of Lies",
      "Lord of Darkness"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Destructive Spirit",
      "Ahriman",
      "Adversary",
      "Father of Lies",
      "Lord of Darkness",
      "Druj (Lie)",
      "Darkness",
      "Death",
      "Disease",
      "Chaos",
      "Destruction"
    ],
    "attributes": [],
    "symbols": [
      "Serpent",
      "Darkness",
      "Scorpion",
      "Winter",
      "Drought"
    ]
  },
  "name": "Angra Mainyu",
  "primarySources": [
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Destructive Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Destructive Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Nature",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Destructive Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spenta Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Falsehood",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Nature",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Primary Sources",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Druj",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ohrmazd",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Evil Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "World",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Spitama",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Zarathustra",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Avesta",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Vohu Manah",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Good Mind",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Renovation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Savior",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Savior",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "World",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Prayers",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Righteousness",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Power",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Truth",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Other",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Within Persian Tradition",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "The Lie",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Creation",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cross Cultural Parallels",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Disorder",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Chaos",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Significance",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Religion",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Victory",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Cosmic",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Historical",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Concepts",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Angra Mainyu",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahriman",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Destructive Spirit",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    }
  ],
  "attributes": [],
  "id": "angra-mainyu",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "Asha",
      "link": "../cosmology/asha.html"
    },
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "hero",
      "name": "Zoroaster",
      "link": "../heroes/zoroaster.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "Druj",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "Frashokereti",
      "link": "../cosmology/frashokereti.html"
    },
    {
      "type": "cosmology",
      "name": "🌉\n                    Bridge\n                \n                \n                    Chinvat Bridge\n                    Where souls are judged",
      "link": "../cosmology/chinvat-bridge.html"
    },
    {
      "type": "deity",
      "name": "🏺\n                Set\n                Egyptian",
      "link": "../../egyptian/deities/set.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Loki\n                Norse",
      "link": "../../norse/deities/loki.html"
    },
    {
      "type": "cosmology",
      "name": "🌑 Druj (The Lie)",
      "link": "../cosmology/druj.html"
    },
    {
      "type": "cosmology",
      "name": "🌟 Frashokereti",
      "link": "../cosmology/frashokereti.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: atar</summary>

```json
{
  "epithets": [],
  "displayName": "Atar",
  "description": "Yazata of Fire",
  "domains": [],
  "title": "Persian - Atar",
  "symbols": [],
  "mythology": "persian",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Atar",
  "primarySources": [
    {
      "term": "Atar",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Atar",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Atar",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Sacred Fire",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Ahura Mazda",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Mythology",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Atar",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    },
    {
      "term": "Persian Tradition",
      "tradition": "persian",
      "href": "../../../mythos/persian/index.html"
    }
  ],
  "attributes": [],
  "id": "atar",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Hephaestus\n                Greek",
      "link": "../../greek/deities/hephaestus.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Vulcan\n                Roman",
      "link": "../../roman/deities/vulcan.html"
    },
    {
      "type": "deity",
      "name": "☘️\n                Brigid\n                Celtic",
      "link": "../../celtic/deities/brigid.html"
    },
    {
      "type": "cosmology",
      "name": "✨ Asha (Truth)",
      "link": "../cosmology/asha.html"
    }
  ]
}
```

</details>

---

### `rituals` Schema

#### Schema Variation 1

**Fields:**
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `participants` (array)
- `primarySources` (array)
- `purpose` (array)
- `steps` (array)
- `timing` (string)
- `tools` (array)

**Sample Documents:**

<details>
<summary>Document 1: babylonian_akitu</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:18.907Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/rituals/akitu.html",
    "updatedAt": "2025-12-13T02:38:18.907Z"
  },
  "purpose": [],
  "displayName": "🎭 Akitu Festival",
  "timing": "",
  "description": "The Babylonian New Year - Cosmic Renewal and Royal Legitimation",
  "steps": [],
  "tools": [],
  "mythology": "babylonian",
  "filename": "akitu",
  "name": "Akitu",
  "primarySources": [],
  "id": "babylonian_akitu",
  "participants": []
}
```

</details>

<details>
<summary>Document 2: babylonian_divination</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:18.920Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/babylonian/rituals/divination.html",
    "updatedAt": "2025-12-13T02:38:18.920Z"
  },
  "purpose": [],
  "displayName": "🔮 Babylonian Divination",
  "timing": "",
  "description": "Divination was central to Babylonian religious practice,\nserving as the primary means of communicating with the divine realm. Through systematic observation and interpretation of signs,\ntrained priests called baru\ndiscerned the intentions of gods like Marduk and Shamash,\nguiding kings, predicting harvests, and determining auspicious times for ritual action.",
  "steps": [],
  "tools": [],
  "mythology": "babylonian",
  "filename": "divination",
  "name": "World Mythos Explorer",
  "primarySources": [],
  "id": "babylonian_divination",
  "participants": []
}
```

</details>

<details>
<summary>Document 3: buddhist_calendar</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:18.858Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/rituals/calendar.html",
    "updatedAt": "2025-12-13T02:38:18.858Z"
  },
  "purpose": [],
  "displayName": "📅 Buddhist Calendar",
  "timing": "",
  "description": "The Buddhist calendar includes major festivals like Vesak (Buddha's birth, enlightenment, and death), Uposatha days (observance days), and various regional celebrations.",
  "steps": [],
  "tools": [],
  "mythology": "buddhist",
  "filename": "calendar",
  "name": "Rituals",
  "primarySources": [],
  "id": "buddhist_calendar",
  "participants": []
}
```

</details>

<details>
<summary>Document 4: buddhist_offerings</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:18.863Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/buddhist/rituals/offerings.html",
    "updatedAt": "2025-12-13T02:38:18.863Z"
  },
  "purpose": [],
  "displayName": "🕯️ Offerings",
  "timing": "",
  "description": "Traditional offerings include water, flowers, incense, light (candles/lamps), and food. These represent purification, impermanence, devotion, wisdom, and generosity.",
  "steps": [],
  "tools": [],
  "mythology": "buddhist",
  "filename": "offerings",
  "name": "Buddhist Mythology",
  "primarySources": [],
  "id": "buddhist_offerings",
  "participants": []
}
```

</details>

<details>
<summary>Document 5: christian_baptism</summary>

```json
{
  "metadata": {
    "createdAt": "2025-12-13T02:38:18.965Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/rituals/baptism.html",
    "updatedAt": "2025-12-13T02:38:18.965Z"
  },
  "purpose": [],
  "displayName": "Baptism (Holy Baptism)",
  "timing": "",
  "description": "",
  "steps": [],
  "tools": [],
  "mythology": "christian",
  "filename": "baptism",
  "name": "Baptism",
  "primarySources": [],
  "id": "christian_baptism",
  "participants": []
}
```

</details>

---

### `roman` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: apollo</summary>

```json
{
  "epithets": [],
  "displayName": "☀️ Apollo",
  "description": "God of Sun, Prophecy, Healing, Music & Arts",
  "domains": [],
  "title": "Roman - Apollo",
  "symbols": [],
  "mythology": "roman",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Apollo",
  "primarySources": [
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Excellence",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=virtus"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?term=attributes"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Worship",
      "tradition": null,
      "href": "../corpus-search.html?term=worship"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "worship",
      "tradition": null,
      "href": "../corpus-search.html?term=worship"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Festivals",
      "tradition": null,
      "href": "../corpus-search.html?term=festivals"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Related Concepts",
      "tradition": null,
      "href": "../corpus-search.html?term=related concepts"
    },
    {
      "term": "Within Roman",
      "tradition": null,
      "href": "../corpus-search.html?term=within roman"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Similar Deities",
      "tradition": null,
      "href": "../corpus-search.html?term=similar deities"
    },
    {
      "term": "Apollo",
      "tradition": null,
      "href": "../corpus-search.html?term=apollo"
    },
    {
      "term": "Apollo",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=apollo"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "apollo",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇬🇷\n            Apollo (Greek)\n            Identical deity",
      "link": "../../greek/deities/apollo.html"
    },
    {
      "type": "deity",
      "name": "🇪🇬\n            Ra\n            Supreme sun god",
      "link": "../../egyptian/deities/ra.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: bacchus</summary>

```json
{
  "epithets": [],
  "displayName": "Bacchus Liber",
  "description": "God of Wine, Ecstasy, Fertility & Divine Madness",
  "domains": [],
  "title": "Roman - Bacchus",
  "symbols": [],
  "mythology": "roman",
  "relationships": {
    "mother": "semele (mortal princess of thebes)",
    "children": [
      "priapus (with venus)",
      "hymen",
      "often depicted with thyrsus staffs",
      "spirits who accompanied the god"
    ],
    "consort": "ariadne (cretan princess elevated to divinity)",
    "father": "jupiter"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "semele (mortal princess of thebes)",
      "children": [
        "priapus (with venus)",
        "hymen",
        "often depicted with thyrsus staffs",
        "spirits who accompanied the god"
      ],
      "consort": "ariadne (cretan princess elevated to divinity)",
      "father": "jupiter"
    },
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Bacchus",
  "primarySources": [],
  "attributes": [],
  "id": "bacchus",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Dionysus",
      "link": "../../greek/deities/dionysus.html"
    },
    {
      "type": "deity",
      "name": "Greek Dionysus",
      "link": "../../greek/deities/dionysus.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Dionysus\n                Greek\n                Direct Equivalent",
      "link": "../../greek/deities/dionysus.html"
    },
    {
      "type": "deity",
      "name": "☥️\n                Osiris\n                Egyptian",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "🏛️ Dionysus (Greek)",
      "link": "../../greek/deities/dionysus.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: ceres</summary>

```json
{
  "epithets": [],
  "displayName": "🌾 Ceres",
  "description": "Goddess of Agriculture, Grain & Fertility",
  "domains": [],
  "title": "Roman - Ceres",
  "symbols": [],
  "mythology": "roman",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Ceres",
  "primarySources": [
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Proserpina",
      "tradition": null,
      "href": "../corpus-search.html?term=proserpina"
    },
    {
      "term": "Underworld",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=underworld"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?term=attributes"
    },
    {
      "term": "Proserpina",
      "tradition": null,
      "href": "../corpus-search.html?term=proserpina"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Proserpina",
      "tradition": null,
      "href": "../corpus-search.html?term=proserpina"
    },
    {
      "term": "Pluto",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=pluto"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Jupiter",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=zeus"
    },
    {
      "term": "Proserpina",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=proserpina"
    },
    {
      "term": "Underworld",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=underworld"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Proserpina",
      "tradition": "roman",
      "href": "../../../mythos/roman/corpus-search.html?term=proserpina"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Festivals",
      "tradition": null,
      "href": "../corpus-search.html?term=festivals"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "offerings",
      "tradition": null,
      "href": "../corpus-search.html?term=offerings"
    },
    {
      "term": "Ceres",
      "tradition": null,
      "href": "../corpus-search.html?term=ceres"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Proserpina",
      "tradition": null,
      "href": "../corpus-search.html?term=proserpina"
    },
    {
      "term": "Related Concepts",
      "tradition": null,
      "href": "../corpus-search.html?term=related concepts"
    },
    {
      "term": "Within Roman",
      "tradition": null,
      "href": "../corpus-search.html?term=within roman"
    },
    {
      "term": "Underworld",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=underworld"
    },
    {
      "term": "Proserpina",
      "tradition": null,
      "href": "../corpus-search.html?term=proserpina"
    },
    {
      "term": "Similar Deities",
      "tradition": null,
      "href": "../corpus-search.html?term=similar deities"
    },
    {
      "term": "Demeter",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Ceres",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=demeter"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "ceres",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇬🇷\n            Demeter\n            Direct equivalent",
      "link": "../../greek/deities/demeter.html"
    },
    {
      "type": "deity",
      "name": "🇪🇬\n            Isis\n            Agricultural aspect",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "🇳🇴\n            Freya\n            Fertility goddess",
      "link": "../../norse/deities/freya.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: cupid</summary>

```json
{
  "epithets": [],
  "displayName": "Cupido Amor",
  "description": "God of Desire, Erotic Love & Attraction",
  "domains": [],
  "title": "Roman - Cupid",
  "symbols": [],
  "mythology": "roman",
  "relationships": {
    "mother": "venus (most common tradition)",
    "consort": "psyche (soul)",
    "father": "mars (most common tradition)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "venus (most common tradition)",
      "consort": "psyche (soul)",
      "father": "mars (most common tradition)"
    },
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Cupid",
  "primarySources": [],
  "attributes": [],
  "id": "cupid",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Eros",
      "link": "../../greek/deities/eros.html"
    },
    {
      "type": "deity",
      "name": "Greek Eros",
      "link": "../../greek/deities/eros.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Eros\n                Greek\n                Direct Equivalent",
      "link": "../../greek/deities/eros.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Freya\n                Norse",
      "link": "../../norse/deities/freya.html"
    },
    {
      "type": "deity",
      "name": "☥️\n                Hathor\n                Egyptian",
      "link": "../../egyptian/deities/hathor.html"
    },
    {
      "type": "deity",
      "name": "🏛️ Eros (Greek)",
      "link": "../../greek/deities/eros.html"
    },
    {
      "type": "hero",
      "name": "💖 Cupid & Psyche",
      "link": "../../greek/heroes/eros-psyche.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: diana</summary>

```json
{
  "epithets": [],
  "displayName": "🌙 Diana",
  "description": "Goddess of the Hunt, Moon, Wilderness & Childbirth",
  "domains": [],
  "title": "Roman - Diana",
  "symbols": [],
  "mythology": "roman",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Diana",
  "primarySources": [
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Attributes",
      "tradition": null,
      "href": "../corpus-search.html?term=attributes"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred Sites",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred sites"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "sacred",
      "tradition": null,
      "href": "../corpus-search.html?term=sacred"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Diana",
      "tradition": null,
      "href": "../corpus-search.html?term=diana"
    },
    {
      "term": "Huntress",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Heaven",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=olympus"
    },
    {
      "term": "Underworld",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=underworld"
    },
    {
      "term": "Related Concepts",
      "tradition": null,
      "href": "../corpus-search.html?term=related concepts"
    },
    {
      "term": "Within Roman",
      "tradition": null,
      "href": "../corpus-search.html?term=within roman"
    },
    {
      "term": "Similar Deities",
      "tradition": null,
      "href": "../corpus-search.html?term=similar deities"
    },
    {
      "term": "Artemis",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Diana",
      "tradition": "greek",
      "href": "../../../mythos/greek/corpus-search.html?term=artemis"
    },
    {
      "term": "Mythology",
      "tradition": null,
      "href": "../corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "diana",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🇬🇷\n            Artemis\n            Direct equivalent",
      "link": "../../greek/deities/artemis.html"
    },
    {
      "type": "deity",
      "name": "🇪🇬\n            Bastet\n            Huntress aspect",
      "link": "../../egyptian/deities/bastet.html"
    },
    {
      "type": "deity",
      "name": "🇳🇴\n            Skadi\n            Hunt goddess",
      "link": "../../norse/deities/skadi.html"
    }
  ]
}
```

</details>

---

### `search_index` Schema

#### Schema Variation 1

**Fields:**
- `autocompletePrefixes` (array)
- `contentType` (string)
- `createdAt` (string)
- `description` (string)
- `displayName` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `qualityScore` (number)
- `searchTokens` (array)
- `sourceFile` (string)
- `tags` (array)

#### Schema Variation 2

**Fields:**
- `archetypes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `searchTerms` (array)
- `type` (string)

#### Schema Variation 3

**Fields:**
- `description` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `searchTerms` (array)
- `type` (string)

**Sample Documents:**

<details>
<summary>Document 1: aengus</summary>

```json
{
  "metadata": {
    "sourceCount": 32,
    "verified": false,
    "hasDescription": false,
    "hasPrimarySources": true
  },
  "displayName": "Aengus Óg (Oengus, Mac Óg)",
  "autocompletePrefixes": [
    "a",
    "ae",
    "aen",
    "aeng",
    "aengu",
    "aengus",
    "aengus ",
    "aengus ó",
    "aengus óg"
  ],
  "description": "God of Love, Youth, and Poetic Inspiration",
  "sourceFile": "",
  "mythology": "celtic",
  "tags": [
    "celtic"
  ],
  "searchTokens": [
    "aengus",
    "oengus",
    "mac",
    "god",
    "love",
    "youth",
    "poetic",
    "inspiration",
    "celtic",
    "young",
    "son",
    "ind",
    "brugh",
    "dream",
    "lord",
    "beauty",
    "poetry",
    "dreams",
    "music",
    "protection",
    "lovers",
    "summer",
    "four",
    "birds",
    "circling",
    "head",
    "kisses",
    "transformed",
    "harp",
    "golden",
    "hair",
    "inne",
    "swans",
    "especially",
    "paired",
    "songbirds",
    "hawthorn",
    "fairy",
    "tree",
    "apple",
    "blossoms",
    "roses",
    "mistletoe"
  ],
  "name": "Aengus Óg",
  "qualityScore": 35,
  "id": "aengus",
  "contentType": "celtic",
  "createdAt": "2025-12-13T02:53:49.060Z"
}
```

</details>

<details>
<summary>Document 2: ah-puch</summary>

```json
{
  "metadata": {
    "sourceCount": 0,
    "verified": false,
    "hasDescription": false,
    "hasPrimarySources": false
  },
  "displayName": "💀 Ah Puch",
  "autocompletePrefixes": [
    "a",
    "ah",
    "ah ",
    "ah p",
    "ah pu",
    "ah puc",
    "ah puch"
  ],
  "description": "Ah Pukuh - \"The Destroyer\" / \"The Fleshless One\"",
  "sourceFile": "",
  "mythology": "mayan",
  "tags": [
    "mayan"
  ],
  "searchTokens": [
    "puch",
    "pukuh",
    "destroyer",
    "fleshless",
    "one",
    "mayan",
    "maya",
    "xibalba",
    "place",
    "fear",
    "underworld",
    "death",
    "decay",
    "disease",
    "darkness",
    "misfortune",
    "ninth",
    "level",
    "skull",
    "bones",
    "owl",
    "percentage",
    "sign",
    "eye",
    "corpse",
    "spots",
    "bells",
    "messenger",
    "dog",
    "guide",
    "jaguar",
    "vulture",
    "bat",
    "skeletal",
    "figure",
    "exposed",
    "ribs",
    "vertebrae",
    "distended",
    "belly",
    "representing",
    "often",
    "shown",
    "body",
    "kisin",
    "stinking",
    "yum",
    "kimil",
    "lord",
    "hun",
    "ahau"
  ],
  "name": "Ah Puch",
  "qualityScore": 15,
  "id": "ah-puch",
  "contentType": "mayan",
  "createdAt": "2025-12-13T02:53:49.079Z"
}
```

</details>

<details>
<summary>Document 3: ahura-mazda</summary>

```json
{
  "metadata": {
    "sourceCount": 144,
    "verified": false,
    "hasDescription": false,
    "hasPrimarySources": true
  },
  "displayName": "⚡ Ahura Mazda",
  "autocompletePrefixes": [
    "a",
    "ah",
    "ahu",
    "ahur",
    "ahura",
    "ahura ",
    "ahura m",
    "ahura ma",
    "ahura maz",
    "ahura mazd"
  ],
  "description": "The Wise Lord, Supreme Creator",
  "sourceFile": "",
  "mythology": "persian",
  "tags": [
    "persian"
  ],
  "searchTokens": [
    "ahura",
    "mazda",
    "wise",
    "lord",
    "supreme",
    "creator",
    "persian",
    "wisdom",
    "all",
    "uncreated",
    "spenta",
    "mainyu",
    "asha",
    "truth",
    "light",
    "creation",
    "order",
    "goodness",
    "faravahar",
    "winged",
    "disk",
    "sacred",
    "fire",
    "sun",
    "bull",
    "symbol",
    "white",
    "horse",
    "eagle",
    "cypress",
    "tree",
    "haoma",
    "pomegranate"
  ],
  "name": "Ahura Mazda",
  "qualityScore": 35,
  "id": "ahura-mazda",
  "contentType": "persian",
  "createdAt": "2025-12-13T02:53:49.083Z"
}
```

</details>

<details>
<summary>Document 4: allah</summary>

```json
{
  "metadata": {
    "sourceCount": 46,
    "verified": false,
    "hasDescription": false,
    "hasPrimarySources": true
  },
  "displayName": "The 99 Beautiful Names (Asma al-Husna)",
  "autocompletePrefixes": [
    "i",
    "is",
    "isl",
    "isla",
    "islam",
    "islami",
    "islamic",
    "islamic ",
    "islamic t",
    "islamic th"
  ],
  "description": "الله - The One, The Eternal, The Absolute",
  "sourceFile": "",
  "mythology": "islamic",
  "tags": [
    "islamic"
  ],
  "searchTokens": [
    "islamic",
    "theology",
    "beautiful",
    "names",
    "asma",
    "husna",
    "one",
    "eternal",
    "absolute",
    "allah",
    "all",
    "creation",
    "knowledge",
    "power",
    "crescent",
    "moon",
    "star",
    "calligraphy",
    "quran",
    "revealed",
    "word",
    "rahman",
    "compassionate",
    "rahim",
    "merciful"
  ],
  "name": "Islamic Theology",
  "qualityScore": 35,
  "id": "allah",
  "contentType": "islamic",
  "createdAt": "2025-12-13T02:53:49.077Z"
}
```

</details>

<details>
<summary>Document 5: amaterasu</summary>

```json
{
  "metadata": {
    "sourceCount": 0,
    "verified": false,
    "hasDescription": false,
    "hasPrimarySources": false
  },
  "displayName": "Amaterasu-Omikami (天照大神)",
  "autocompletePrefixes": [
    "a",
    "am",
    "ama",
    "amat",
    "amate",
    "amater",
    "amatera",
    "amateras",
    "amaterasu"
  ],
  "description": "Great Divinity Illuminating Heaven",
  "sourceFile": "",
  "mythology": "japanese",
  "tags": [
    "japanese"
  ],
  "searchTokens": [
    "amaterasu",
    "omikami",
    "great",
    "divinity",
    "illuminating",
    "heaven",
    "japanese",
    "sun",
    "light",
    "warmth",
    "agriculture",
    "weaving",
    "imperial",
    "sovereignty",
    "cosmic",
    "order",
    "purification",
    "rising",
    "sacred",
    "mirror",
    "yata",
    "kagami",
    "rice",
    "hinomaru",
    "disc",
    "golden",
    "radiance",
    "rooster",
    "niwatori",
    "whose",
    "crow",
    "summoned",
    "cave",
    "horse",
    "divine",
    "white",
    "sakaki",
    "cleyera",
    "japonica",
    "evergreen",
    "ine",
    "gift",
    "humanity",
    "eight",
    "span",
    "magatama",
    "jewels",
    "shimenawa",
    "rope",
    "august",
    "kami",
    "who",
    "shines",
    "ohirume",
    "muchi",
    "female",
    "deity",
    "tensho",
    "daijin",
    "sino",
    "reading",
    "shining",
    "ancestress",
    "line",
    "queen",
    "lady"
  ],
  "name": "Amaterasu",
  "qualityScore": 15,
  "id": "amaterasu",
  "contentType": "japanese",
  "createdAt": "2025-12-13T02:53:49.078Z"
}
```

</details>

---

### `sumerian` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: an</summary>

```json
{
  "epithets": [
    "Father of the Gods",
    "King of Heaven",
    "Lord of Constellations"
  ],
  "displayName": "An (Anu)",
  "description": "The Sky God, King of Gods",
  "domains": [
    "Father of the Gods",
    "King of Heaven",
    "Lord of Constellations",
    "Sky",
    "Heaven",
    "Authority",
    "Kingship",
    "Fate",
    "Constellations"
  ],
  "title": "Sumerian - An",
  "symbols": [
    "Horned crown",
    "bull",
    "star (𒀭)",
    "scepter",
    "Bull (strength and fertility)",
    "Cedar (royal tree)"
  ],
  "mythology": "sumerian",
  "relationships": {
    "children": [
      "enlil (lord wind)",
      "enki (lord wisdom)",
      "nanna (moon)",
      "inanna (some traditions)"
    ],
    "consort": "allies & enemies"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "enlil (lord wind)",
        "enki (lord wisdom)",
        "nanna (moon)",
        "inanna (some traditions)"
      ],
      "consort": "allies & enemies"
    },
    "epithets": [
      "Father of the Gods",
      "King of Heaven",
      "Lord of Constellations"
    ],
    "archetypes": [],
    "displayName": "An (Anu)",
    "domains": [
      "Father of the Gods",
      "King of Heaven",
      "Lord of Constellations",
      "Sky",
      "Heaven",
      "Authority",
      "Kingship",
      "Fate",
      "Constellations"
    ],
    "attributes": [],
    "symbols": [
      "Horned crown",
      "bull",
      "star (𒀭)",
      "scepter",
      "Bull (strength and fertility)",
      "Cedar (royal tree)"
    ]
  },
  "name": "An",
  "primarySources": [
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "Father of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Father of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "𒀭",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=an"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Deep",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Key Myths",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Mountain",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=kur"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Divine Decrees",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "King of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Primary",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "When on High",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Tiamat",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tiamat"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "Babylonian Creation Epic",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Father of the Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=texts"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Relationships",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=relationships"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Lord Wind",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Nanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sin"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Anunnaki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Allies",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=allies"
    },
    {
      "term": "Anunnaki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Primary",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Rituals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=rituals"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Deities",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=deities"
    },
    {
      "term": "Invocations",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=invocations"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Prayers",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=prayers"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Related Concepts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Sumerian Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=within%20sumerian%20tradition"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Anu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "an",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Creation Myth",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Anunnaki",
      "link": "../cosmology/anunnaki.html"
    },
    {
      "type": "deity",
      "name": "Anu (via Marduk)",
      "link": "../../babylonian/deities/marduk.html"
    },
    {
      "type": "deity",
      "name": "Atum-Ra",
      "link": "../../egyptian/deities/atum.html"
    },
    {
      "type": "deity",
      "name": "Odin",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "Atum",
      "link": "../../egyptian/deities/atum.html"
    },
    {
      "type": "cosmology",
      "name": "The Anunnaki",
      "link": "../cosmology/anunnaki.html"
    },
    {
      "type": "cosmology",
      "name": "Creation Myths",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "The Me",
      "link": "../cosmology/me.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: dumuzi</summary>

```json
{
  "epithets": [
    "Lord of Shepherds",
    "Beloved of Inanna",
    "The Green One"
  ],
  "displayName": "Dumuzi (Tammuz)",
  "description": "The Dying and Rising God, Shepherd of the People",
  "domains": [
    "Lord of Shepherds",
    "Beloved of Inanna",
    "The Green One",
    "Shepherds",
    "fertility",
    "vegetation",
    "renewal",
    "seasonal cycles"
  ],
  "title": "Sumerian - Dumuzi",
  "symbols": [
    "Shepherd's crook",
    "grain",
    "green vegetation",
    "reed pipe",
    "Sheep",
    "ram",
    "goat (shepherd's flock)"
  ],
  "mythology": "sumerian",
  "relationships": {
    "consort": "inanna (who condemned him but also mourned him)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "consort": "inanna (who condemned him but also mourned him)"
    },
    "epithets": [
      "Lord of Shepherds",
      "Beloved of Inanna",
      "The Green One"
    ],
    "archetypes": [],
    "displayName": "Dumuzi (Tammuz)",
    "domains": [
      "Lord of Shepherds",
      "Beloved of Inanna",
      "The Green One",
      "Shepherds",
      "fertility",
      "vegetation",
      "renewal",
      "seasonal cycles"
    ],
    "attributes": [],
    "symbols": [
      "Shepherd's crook",
      "grain",
      "green vegetation",
      "reed pipe",
      "Sheep",
      "ram",
      "goat (shepherd's flock)"
    ]
  },
  "name": "Dumuzi",
  "primarySources": [
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Shepherd of the People",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=hammurabi"
    },
    {
      "term": "The Shepherd",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Rituals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=rituals"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dying God",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Relationships",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=relationships"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Enkimdu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enkidu"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Related Concepts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Sumerian Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=within%20sumerian%20tradition"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Tammuz",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "dumuzi",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Kur",
      "link": "../cosmology/afterlife.html"
    },
    {
      "type": "deity",
      "name": "Osiris",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "cosmology",
      "name": "The Underworld",
      "link": "../cosmology/afterlife.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: enki</summary>

```json
{
  "epithets": [
    "Lord of the Abzu",
    "King of the Earth",
    "Lord of Wisdom",
    "Lord of Eridu"
  ],
  "displayName": "Enki (Ea)",
  "description": "Lord of Wisdom and the Sweet Waters",
  "domains": [
    "Lord of the Abzu",
    "King of the Earth",
    "Lord of Wisdom",
    "Lord of Eridu",
    "Fresh water",
    "wisdom",
    "magic",
    "crafts",
    "creation",
    "healing",
    "knowledge"
  ],
  "title": "Sumerian - Enki",
  "symbols": [
    "Goat-fish (Capricorn)",
    "flowing water",
    "two-headed serpent",
    "Goat-fish",
    "turtle",
    "ram",
    "Tamarisk tree",
    "date palm",
    "reeds"
  ],
  "mythology": "sumerian",
  "relationships": {
    "mother": "goddess)",
    "children": [
      "marduk (babylonian",
      "becomes supreme god)",
      "nanshe (social justice goddess)",
      "ningirsu/ninurta (warrior god in some traditions)",
      "his rival",
      "inanna (though he regrets giving her the me)",
      "humanity (his creation",
      "enki preserves)"
    ]
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "goddess)",
      "children": [
        "marduk (babylonian",
        "becomes supreme god)",
        "nanshe (social justice goddess)",
        "ningirsu/ninurta (warrior god in some traditions)",
        "his rival",
        "inanna (though he regrets giving her the me)",
        "humanity (his creation",
        "enki preserves)"
      ]
    },
    "epithets": [
      "Lord of the Abzu",
      "King of the Earth",
      "Lord of Wisdom",
      "Lord of Eridu"
    ],
    "archetypes": [],
    "displayName": "Enki (Ea)",
    "domains": [
      "Lord of the Abzu",
      "King of the Earth",
      "Lord of Wisdom",
      "Lord of Eridu",
      "Fresh water",
      "wisdom",
      "magic",
      "crafts",
      "creation",
      "healing",
      "knowledge"
    ],
    "attributes": [],
    "symbols": [
      "Goat-fish (Capricorn)",
      "flowing water",
      "two-headed serpent",
      "Goat-fish",
      "turtle",
      "ram",
      "Tamarisk tree",
      "date palm",
      "reeds"
    ]
  },
  "name": "Enki",
  "primarySources": [
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Lord of Wisdom",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Sweet Waters",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Lord of Wisdom",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nabu"
    },
    {
      "term": "Lord of Eridu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Divine Decrees",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Key Myths",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Lesser Gods",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=igigi"
    },
    {
      "term": "Igigi",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=igigi"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Dilmun",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dilmun"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninmah",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Apsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Underground Ocean",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Deep",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Sumerian Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian%20tradition"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Relationships",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=relationships"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Primary",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary"
    },
    {
      "term": "Marduk",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Ningirsu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ninurta"
    },
    {
      "term": "Ninurta",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ninurta"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Asarluhi",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=marduk"
    },
    {
      "term": "Allies",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=allies"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Me",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Other",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=other"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninmah",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ninhursag",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Sumerian Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian%20tradition"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Festivals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=festivals"
    },
    {
      "term": "Festivals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=festivals"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Invocations",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=invocations"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Prayers",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=prayers"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Deep",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=abzu"
    },
    {
      "term": "Abzu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=apsu"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Ea",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "enki",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Ea",
      "link": "../../babylonian/deities/ea.html"
    },
    {
      "type": "cosmology",
      "name": "📜\n                \n                    The Me (Divine Powers)\n                    Cosmic Forces\n                    100+ powers of civilization",
      "link": "../cosmology/me.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Ea\n                Babylonian",
      "link": "../../babylonian/deities/ea.html"
    },
    {
      "type": "deity",
      "name": "🔱\n                Poseidon\n                Greek",
      "link": "../../greek/deities/poseidon.html"
    },
    {
      "type": "deity",
      "name": "🔺\n                Thoth\n                Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🔥\n                Prometheus\n                Greek",
      "link": "../../greek/deities/prometheus.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Creation of Humanity",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "📜 The Me (Divine Powers)",
      "link": "../cosmology/me.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: enlil</summary>

```json
{
  "epithets": [
    "Lord of the Wind",
    "King of Heaven and Earth",
    "Great Mountain",
    "Father of Gods"
  ],
  "displayName": "🌪️ Enlil",
  "description": "Lord Wind and Storm, King of Heaven and Earth",
  "domains": [
    "Lord of the Wind",
    "King of Heaven and Earth",
    "Great Mountain",
    "Father of Gods",
    "Wind",
    "storms",
    "earth",
    "kingship",
    "fate",
    "agriculture",
    "authority"
  ],
  "title": "Sumerian - Enlil",
  "symbols": [
    "Horned crown",
    "seven tablets of destiny",
    "scepter",
    "pickaxe",
    "Bull",
    "eagle",
    "Cedar",
    "grain",
    "barley"
  ],
  "mythology": "sumerian",
  "relationships": {
    "children": [
      "nanna (moon god)",
      "ninurta (warrior god)",
      "nergal (war/plague god)",
      "zababa (war god)",
      "enki preserves); anzu (demon who stole his power)"
    ],
    "father": "who delegated power to him)"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "nanna (moon god)",
        "ninurta (warrior god)",
        "nergal (war/plague god)",
        "zababa (war god)",
        "enki preserves); anzu (demon who stole his power)"
      ],
      "father": "who delegated power to him)"
    },
    "epithets": [
      "Lord of the Wind",
      "King of Heaven and Earth",
      "Great Mountain",
      "Father of Gods"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Lord of the Wind",
      "King of Heaven and Earth",
      "Great Mountain",
      "Father of Gods",
      "Wind",
      "storms",
      "earth",
      "kingship",
      "fate",
      "agriculture",
      "authority"
    ],
    "attributes": [],
    "symbols": [
      "Horned crown",
      "seven tablets of destiny",
      "scepter",
      "pickaxe",
      "Bull",
      "eagle",
      "Cedar",
      "grain",
      "barley"
    ]
  },
  "name": "Enlil",
  "primarySources": [
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Lord Wind",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Sumerian",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sumerian"
    },
    {
      "term": "Lord Wind",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Great Mountain",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Key Myths",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Utnapishtim",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Ninurta",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ninurta"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Atrahasis",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=utnapishtim"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enuma Elish",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enuma_elish"
    },
    {
      "term": "Tablet of Destinies",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=tablet_of_destinies"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Cuneiform",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=cuneiform"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Relationships",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=relationships"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Nanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sin"
    },
    {
      "term": "Ninurta",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ninurta"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Enki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enki"
    },
    {
      "term": "Allies",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=allies"
    },
    {
      "term": "Anunnaki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Ninurta",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ninurta"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Primary",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary"
    },
    {
      "term": "Mountain",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=kur"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Akitu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "New Year Festival",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=akitu"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Festivals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=festivals"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Invocations",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=invocations"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Cosmic Order",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=me"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Prayers",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=prayers"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Related Concepts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=related%20concepts"
    },
    {
      "term": "Within Sumerian Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=within%20sumerian%20tradition"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Heaven",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=heaven"
    },
    {
      "term": "Enlil",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=enlil"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Tradition",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=tradition"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Enlil",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enlil"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "enlil",
  "relatedEntities": [
    {
      "type": "cosmology",
      "name": "Creation Myth",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "Anunnaki",
      "link": "../cosmology/anunnaki.html"
    },
    {
      "type": "deity",
      "name": "Ellil/Bel (via Marduk)",
      "link": "../../babylonian/deities/marduk.html"
    },
    {
      "type": "deity",
      "name": "Zeus",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "Odin",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Marduk\n                Babylonian",
      "link": "../../babylonian/deities/marduk.html"
    },
    {
      "type": "deity",
      "name": "⚡\n                Zeus\n                Greek",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "🕉️\n                Indra\n                Hindu",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "cosmology",
      "name": "🌌 Separation of Heaven and Earth",
      "link": "../cosmology/creation.html"
    },
    {
      "type": "cosmology",
      "name": "👑 The Anunnaki",
      "link": "../cosmology/anunnaki.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: ereshkigal</summary>

```json
{
  "epithets": [
    "Queen of Kur",
    "Lady of the Great Below",
    "Queen of the Dead"
  ],
  "displayName": "⚰️ Ereshkigal",
  "description": "Queen of the Great Below, Lady of Kur",
  "domains": [
    "Queen of Kur",
    "Lady of the Great Below",
    "Queen of the Dead",
    "Death",
    "underworld",
    "darkness",
    "finality",
    "judgment"
  ],
  "title": "Sumerian - Ereshkigal",
  "symbols": [
    "Crown of the dead",
    "seven gates",
    "darkness",
    "None (death has no companions)",
    "None grow in the Land of No Return"
  ],
  "mythology": "sumerian",
  "relationships": {
    "children": [
      "ninazu (underworld deity)",
      "nungal (prison goddess)",
      "in some texts\nsiblings: inanna (sister",
      "whom she killed)",
      "utu (sun god)",
      "messenger of death who delivers plague",
      "galla: servants who drag souls to the underworld",
      "enforce her will"
    ],
    "consort": "nergal (god of war and plague"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "children": [
        "ninazu (underworld deity)",
        "nungal (prison goddess)",
        "in some texts\nsiblings: inanna (sister",
        "whom she killed)",
        "utu (sun god)",
        "messenger of death who delivers plague",
        "galla: servants who drag souls to the underworld",
        "enforce her will"
      ],
      "consort": "nergal (god of war and plague"
    },
    "epithets": [
      "Queen of Kur",
      "Lady of the Great Below",
      "Queen of the Dead"
    ],
    "archetypes": [],
    "displayName": null,
    "domains": [
      "Queen of Kur",
      "Lady of the Great Below",
      "Queen of the Dead",
      "Death",
      "underworld",
      "darkness",
      "finality",
      "judgment"
    ],
    "attributes": [],
    "symbols": [
      "Crown of the dead",
      "seven gates",
      "darkness",
      "None (death has no companions)",
      "None grow in the Land of No Return"
    ]
  },
  "name": "Ereshkigal",
  "primarySources": [
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Queen of the Great Below",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Land of No Return",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Great Below",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Attributes",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=attributes"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Great Below",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Sacred",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred"
    },
    {
      "term": "Land of No Return",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Key Myths",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=key%20myths"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Anunnaki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Enki",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ea"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Dumuzi",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=dumuzi"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Queen of Heaven",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Enkidu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enkidu"
    },
    {
      "term": "Enkidu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=enkidu"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Gilgamesh",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=gilgamesh"
    },
    {
      "term": "Netherworld",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Land of No Return",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Land of No Return",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Earth",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=earth"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Seven Gates",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Inanna",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=inanna"
    },
    {
      "term": "Primary Sources   Cuneiform Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=primary%20sources%20%20%20cuneiform%20texts"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Relationships",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=relationships"
    },
    {
      "term": "Nanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=sin"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "An",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=anu"
    },
    {
      "term": "Ki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ninhursag"
    },
    {
      "term": "Nergal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=nergal"
    },
    {
      "term": "Texts",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=texts"
    },
    {
      "term": "Inanna",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ishtar"
    },
    {
      "term": "Utu",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=shamash"
    },
    {
      "term": "Traditions",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=traditions"
    },
    {
      "term": "Allies",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=allies"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Anunnaki",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=anunnaki"
    },
    {
      "term": "Worship",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=worship"
    },
    {
      "term": "Sacred Sites",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=sacred%20sites"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Rituals",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=rituals"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Invocations",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=invocations"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Ereshkigal",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Kur",
      "tradition": "babylonian",
      "href": "../../../mythos/babylonian/corpus-search.html?term=irkalla"
    },
    {
      "term": "Ereshkigal",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=ereshkigal"
    },
    {
      "term": "Mythology",
      "tradition": "sumerian",
      "href": "../../../mythos/sumerian/corpus-search.html?term=mythology"
    }
  ],
  "attributes": [],
  "id": "ereshkigal",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "💀\n                Hades\n                Greek",
      "link": "../../greek/deities/hades.html"
    },
    {
      "type": "deity",
      "name": "🌸\n                Persephone\n                Greek",
      "link": "../../greek/deities/persephone.html"
    },
    {
      "type": "deity",
      "name": "❄️\n                Hel\n                Norse",
      "link": "../../norse/deities/hel.html"
    },
    {
      "type": "deity",
      "name": "🔺\n                Osiris\n                Egyptian",
      "link": "../../egyptian/deities/osiris.html"
    },
    {
      "type": "deity",
      "name": "🗡️ Nergal",
      "link": "../../babylonian/deities/nergal.html"
    },
    {
      "type": "cosmology",
      "name": "🚪 Journey to Kur",
      "link": "../cosmology/afterlife.html"
    }
  ]
}
```

</details>

---

### `symbols` Schema

#### Schema Variation 1

**Fields:**
- `attributes` (array)
- `contentType` (string)
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `relationships` (object)

**Sample Documents:**

<details>
<summary>Document 1: persian_faravahar</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:24.479Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/persian/symbols/faravahar.html",
    "updatedAt": "2025-12-13T02:52:24.479Z"
  },
  "filename": "faravahar",
  "displayName": "Faravahar",
  "name": "Persian Mythology",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "persian_faravahar",
  "contentType": "symbols",
  "mythology": "persian"
}
```

</details>

<details>
<summary>Document 2: persian_sacred-fire</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:24.500Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/persian/symbols/sacred-fire.html",
    "updatedAt": "2025-12-13T02:52:24.500Z"
  },
  "filename": "sacred-fire",
  "displayName": "Sacred Fire (Atar)",
  "name": "Sacred Fire",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "persian_sacred-fire",
  "contentType": "symbols",
  "mythology": "persian"
}
```

</details>

---

### `tarot` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: empress</summary>

```json
{
  "epithets": [],
  "displayName": "👑 The Empress",
  "description": "Divine Mother & Fertility",
  "domains": [
    "Pregnant figure",
    "lush garden",
    "nurturing presence. Corresponds to Gaia",
    "Demeter",
    "Isis",
    "Frigg",
    "Devi."
  ],
  "title": "The Empress (III) - The Great Mother - Tarot Major Arcana",
  "symbols": [
    "Heart Scepter: Rulership through love, not force"
  ],
  "mythology": "tarot",
  "relationships": {},
  "archetypes": [
    "Archetypes",
    "Related Mythological Figures"
  ],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [
      "Archetypes",
      "Related Mythological Figures"
    ],
    "displayName": null,
    "domains": [
      "Pregnant figure",
      "lush garden",
      "nurturing presence. Corresponds to Gaia",
      "Demeter",
      "Isis",
      "Frigg",
      "Devi."
    ],
    "attributes": [],
    "symbols": [
      "Heart Scepter: Rulership through love, not force"
    ]
  },
  "name": "The Great Mother",
  "primarySources": [
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Correspondences",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbolism",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditional Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Primary",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "World",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Other",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "World",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Interpretations",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Upright Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "World",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Mythological Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Meditation",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    }
  ],
  "attributes": [],
  "id": "empress",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Demeter\n                Greek",
      "link": "../../greek/deities/demeter.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Frigg\n                Norse",
      "link": "../../norse/deities/frigg.html"
    },
    {
      "type": "deity",
      "name": "𓂀\n                Isis\n                Egyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "💕\n                Aphrodite\n                Greek",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "Demeter",
      "link": "../../greek/deities/demeter.html"
    },
    {
      "type": "deity",
      "name": "Isis",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "Frigg",
      "link": "../../norse/deities/frigg.html"
    },
    {
      "type": "deity",
      "name": "Aphrodite",
      "link": "../../greek/deities/aphrodite.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: fool</summary>

```json
{
  "epithets": [],
  "displayName": "🃏 The Fool",
  "description": "The Innocent Seeker",
  "domains": [],
  "title": "The Fool (0) - The Innocent Seeker - Tarot Major Arcana",
  "symbols": [],
  "mythology": "tarot",
  "relationships": {},
  "archetypes": [
    "Archetypes",
    "Related Mythological Figures"
  ],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [
      "Archetypes",
      "Related Mythological Figures"
    ],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "The Innocent Seeker",
  "primarySources": [
    {
      "term": "Correspondences",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbolism",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditional Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Journey",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Interpretations",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Upright Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Journey",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Path",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Mythological Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Meditation",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    }
  ],
  "attributes": [],
  "id": "fool",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "⚔️\n                Loki\n                Norse",
      "link": "../../norse/deities/loki.html"
    },
    {
      "type": "deity",
      "name": "🍇\n                Dionysus\n                Greek",
      "link": "../../greek/deities/dionysus.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: high-priestess</summary>

```json
{
  "epithets": [],
  "displayName": "🌙 The High Priestess",
  "description": "Guardian of Hidden Knowledge",
  "domains": [],
  "title": "The High Priestess (II) - Guardian of Hidden Knowledge - Tarot Major Arcana",
  "symbols": [
    "Acts",
    "externalizes",
    "manifests",
    "conscious will",
    "speaks",
    "gives",
    "solar",
    "daylight"
  ],
  "mythology": "tarot",
  "relationships": {},
  "archetypes": [
    "Archetypes",
    "Related Mythological Figures"
  ],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [
      "Archetypes",
      "Related Mythological Figures"
    ],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": [
      "Acts",
      "externalizes",
      "manifests",
      "conscious will",
      "speaks",
      "gives",
      "solar",
      "daylight"
    ]
  },
  "name": "Guardian of Hidden Knowledge",
  "primarySources": [
    {
      "term": "Correspondences",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbolism",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditional Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Interpretations",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Upright Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Mythological Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Meditation",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    }
  ],
  "attributes": [],
  "id": "high-priestess",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "𓂀\n                Isis\n                Egyptian",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "🏛️\n                Persephone\n                Greek",
      "link": "../../greek/deities/persephone.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: lovers</summary>

```json
{
  "epithets": [],
  "displayName": "💑 The Lovers",
  "description": "Sacred Union",
  "domains": [],
  "title": "The Lovers (VI) - Sacred Union - Tarot Major Arcana",
  "symbols": [],
  "mythology": "tarot",
  "relationships": {},
  "archetypes": [
    "Archetypes",
    "Related Mythological Figures"
  ],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [
      "Archetypes",
      "Related Mythological Figures"
    ],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "Sacred Union",
  "primarySources": [
    {
      "term": "Correspondences",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbolism",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditional Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Primary",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Other",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Interpretations",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Upright Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Mythological Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Concepts",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tradition",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditions",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    }
  ],
  "attributes": [],
  "id": "lovers",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "Raphael",
      "link": "../../christian/deities/raphael.html"
    },
    {
      "type": "hero",
      "name": "Eros and Psyche",
      "link": "../../greek/heroes/eros-psyche.html"
    },
    {
      "type": "deity",
      "name": "Isis and Osiris",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "hero",
      "name": "🏛️\n                Eros & Psyche\n                Love's Trials",
      "link": "../../greek/heroes/eros-psyche.html"
    },
    {
      "type": "deity",
      "name": "𓂀\n                Isis & Osiris\n                Sacred Partnership",
      "link": "../../egyptian/deities/isis.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: magician</summary>

```json
{
  "epithets": [],
  "displayName": "🎩 The Magician",
  "description": "As Above, So Below",
  "domains": [],
  "title": "The Magician (I) - As Above, So Below - Tarot Major Arcana",
  "symbols": [],
  "mythology": "tarot",
  "relationships": {},
  "archetypes": [
    "Archetypes",
    "Related Mythological Figures",
    "Hermetic"
  ],
  "rawMetadata": {
    "relationships": {},
    "epithets": [],
    "archetypes": [
      "Archetypes",
      "Related Mythological Figures",
      "Hermetic"
    ],
    "displayName": null,
    "domains": [],
    "attributes": [],
    "symbols": []
  },
  "name": "As Above, So Below",
  "primarySources": [
    {
      "term": "Hermetic",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Correspondences",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Symbolism",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Other",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Traditional Symbols",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Hermetic",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Tarot",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Interpretations",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Upright Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Reversed",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual Meaning",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Hermetic",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Spiritual",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Archetypes",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Related Mythological Figures",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Hermetic",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Meditation",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    },
    {
      "term": "Major Arcana",
      "tradition": "tarot",
      "href": "../../../mythos/tarot/index.html"
    }
  ],
  "attributes": [],
  "id": "magician",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "🏛️\n                Hermes\n                Greek",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "𓂀\n                Thoth\n                Egyptian",
      "link": "../../egyptian/deities/thoth.html"
    },
    {
      "type": "deity",
      "name": "⚔️\n                Odin\n                Norse",
      "link": "../../norse/deities/odin.html"
    },
    {
      "type": "deity",
      "name": "🦅\n                Mercury\n                Roman",
      "link": "../../roman/deities/mercury.html"
    }
  ]
}
```

</details>

---

### `texts` Schema

#### Schema Variation 1

**Fields:**
- `attributes` (array)
- `contentType` (string)
- `description` (string)
- `displayName` (string)
- `filename` (string)
- `id` (string)
- `metadata` (object)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `relationships` (object)

**Sample Documents:**

<details>
<summary>Document 1: christian_144000</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:19.591Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/texts/revelation/144000.html",
    "updatedAt": "2025-12-13T02:52:19.591Z"
  },
  "filename": "144000",
  "displayName": "The 144,000 Sealed",
  "name": "Revelation 7, 14",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "christian_144000",
  "contentType": "texts",
  "mythology": "christian"
}
```

</details>

<details>
<summary>Document 2: christian_babylon-fall-detailed</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:19.816Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/texts/revelation/parallels/babylon-fall-detailed.html",
    "updatedAt": "2025-12-13T02:52:19.816Z"
  },
  "filename": "babylon-fall-detailed",
  "displayName": "Babylon's Fall: Phrase-by-Phrase Parallels",
  "name": "Isaiah, Jeremiah, and Revelation Phrase",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "christian_babylon-fall-detailed",
  "contentType": "texts",
  "mythology": "christian"
}
```

</details>

<details>
<summary>Document 3: christian_babylon-falls</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:19.602Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/texts/revelation/babylon-falls.html",
    "updatedAt": "2025-12-13T02:52:19.602Z"
  },
  "filename": "babylon-falls",
  "displayName": "The Fall of Babylon",
  "name": "Revelation 17",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "christian_babylon-falls",
  "contentType": "texts",
  "mythology": "christian"
}
```

</details>

<details>
<summary>Document 4: christian_beast-kingdoms-progression</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:19.852Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/texts/revelation/parallels/beast-kingdoms-progression.html",
    "updatedAt": "2025-12-13T02:52:19.852Z"
  },
  "filename": "beast-kingdoms-progression",
  "displayName": "Beast Kingdoms Progression",
  "name": "Daniel's Statue and Beasts to Revelation's Composite Beast",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "christian_beast-kingdoms-progression",
  "contentType": "texts",
  "mythology": "christian"
}
```

</details>

<details>
<summary>Document 5: christian_christ-returns</summary>

```json
{
  "relationships": {},
  "metadata": {
    "createdAt": "2025-12-13T02:52:19.612Z",
    "createdBy": "system",
    "verified": false,
    "source": "html_parser",
    "sourceFile": "mythos/christian/texts/revelation/christ-returns.html",
    "updatedAt": "2025-12-13T02:52:19.612Z"
  },
  "filename": "christ-returns",
  "displayName": "The Return of Christ",
  "name": "Revelation 19",
  "primarySources": [],
  "description": "",
  "attributes": [],
  "id": "christian_christ-returns",
  "contentType": "texts",
  "mythology": "christian"
}
```

</details>

---

### `users` Schema

#### Schema Variation 1

**Fields:**
- `avatar` (string)
- `createdAt` (object)
- `displayName` (string)
- `email` (string)
- `photoURL` (string)
- `updatedAt` (object)
- `username` (string)

**Sample Documents:**

<details>
<summary>Document 1: I80OwUmlALVg2KMpr8gDNLmwVmW2</summary>

```json
{
  "avatar": "https://lh3.googleusercontent.com/a/ACg8ocIihJGyZ-Dhjhyt4eVJv5zt_mCVPJ4LDy5JL_ZXfd3LSxy2yQ25=s96-c",
  "email": "andrewkwatts@gmail.com",
  "username": "Andrew Watts",
  "createdAt": {
    "_seconds": 1765085801,
    "_nanoseconds": 666000000
  },
  "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocIihJGyZ-Dhjhyt4eVJv5zt_mCVPJ4LDy5JL_ZXfd3LSxy2yQ25=s96-c",
  "displayName": "Andrew Watts",
  "updatedAt": {
    "_seconds": 1765100398,
    "_nanoseconds": 208000000
  }
}
```

</details>

---

### `yoruba` Schema

#### Schema Variation 1

**Fields:**
- `archetypes` (array)
- `attributes` (array)
- `description` (string)
- `displayName` (string)
- `domains` (array)
- `epithets` (array)
- `id` (string)
- `mythology` (string)
- `name` (string)
- `primarySources` (array)
- `rawMetadata` (object)
- `relatedEntities` (array)
- `relationships` (object)
- `symbols` (array)
- `title` (string)

**Sample Documents:**

<details>
<summary>Document 1: eshu</summary>

```json
{
  "epithets": [
    "Esu Odara (Eshu the Good)",
    "Esu Laroye (Eshu the Talker)",
    "Alaroye (Owner of the Road)",
    "Onibode (Gatekeeper)",
    "Bara (Father of Roads)"
  ],
  "displayName": "Eshu (Elegba, Elegua, Legba, Exu)",
  "description": "Orisha of Crossroads, Messenger of the Gods, Divine Trickster",
  "domains": [
    "Esu Odara (Eshu the Good)",
    "Esu Laroye (Eshu the Talker)",
    "Alaroye (Owner of the Road)",
    "Onibode (Gatekeeper)",
    "Bara (Father of Roads)",
    "Crossroads",
    "communication",
    "language",
    "messages",
    "chance",
    "choice",
    "doors",
    "keys",
    "duality",
    "transformation",
    "tricks",
    "fate"
  ],
  "title": "Yoruba - Eshu - Orisha of Crossroads and Communication",
  "symbols": [
    "Crossroads",
    "laterite stone",
    "cowrie shells",
    "hooked staff (ogo)",
    "keys",
    "palm frond",
    "gourd",
    "phallus",
    "3 (and 21)"
  ],
  "mythology": "yoruba",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Esu Odara (Eshu the Good)",
      "Esu Laroye (Eshu the Talker)",
      "Alaroye (Owner of the Road)",
      "Onibode (Gatekeeper)",
      "Bara (Father of Roads)"
    ],
    "archetypes": [],
    "displayName": "Eshu (Elegba, Elegua, Legba, Exu)",
    "domains": [
      "Esu Odara (Eshu the Good)",
      "Esu Laroye (Eshu the Talker)",
      "Alaroye (Owner of the Road)",
      "Onibode (Gatekeeper)",
      "Bara (Father of Roads)",
      "Crossroads",
      "communication",
      "language",
      "messages",
      "chance",
      "choice",
      "doors",
      "keys",
      "duality",
      "transformation",
      "tricks",
      "fate"
    ],
    "attributes": [],
    "symbols": [
      "Crossroads",
      "laterite stone",
      "cowrie shells",
      "hooked staff (ogo)",
      "keys",
      "palm frond",
      "gourd",
      "phallus",
      "3 (and 21)"
    ]
  },
  "name": "Eshu",
  "primarySources": [],
  "attributes": [],
  "id": "eshu",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "GR\n                Hermes\n                Greek - Messenger",
      "link": "../../greek/deities/hermes.html"
    },
    {
      "type": "deity",
      "name": "NR\n                Loki\n                Norse - Trickster",
      "link": "../../norse/deities/loki.html"
    },
    {
      "type": "deity",
      "name": "RM\n                Mercury\n                Roman - Messenger",
      "link": "../../roman/deities/mercury.html"
    },
    {
      "type": "deity",
      "name": "EG\n                Thoth\n                Egyptian - Messenger",
      "link": "../../egyptian/deities/thoth.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 2: ogun</summary>

```json
{
  "epithets": [
    "Ogun Onire (Ogun of Ire)",
    "Ogun Alara",
    "Ogun Onigbajamo",
    "Ogun Meji",
    "Osin Imole (Chief of the Orisha)"
  ],
  "displayName": "Ogun (Oggun, Ogum)",
  "description": "Orisha of Iron, War, Labor, and Technology",
  "domains": [
    "Ogun Onire (Ogun of Ire)",
    "Ogun Alara",
    "Ogun Onigbajamo",
    "Ogun Meji",
    "Osin Imole (Chief of the Orisha)",
    "Iron",
    "metalwork",
    "war",
    "hunting",
    "surgery",
    "technology",
    "labor",
    "justice",
    "truth",
    "clearing paths"
  ],
  "title": "Yoruba - Ogun - Orisha of Iron and War",
  "symbols": [
    "Machete (Ida)",
    "anvil",
    "iron tools",
    "chains",
    "railroad spikes",
    "dog",
    "palm fronds",
    "7 (and 3)"
  ],
  "mythology": "yoruba",
  "relationships": {
    "father": "oduduwa (mythical ancestor of the yoruba) in some traditions; oranmiyan in others"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "father": "oduduwa (mythical ancestor of the yoruba) in some traditions; oranmiyan in others"
    },
    "epithets": [
      "Ogun Onire (Ogun of Ire)",
      "Ogun Alara",
      "Ogun Onigbajamo",
      "Ogun Meji",
      "Osin Imole (Chief of the Orisha)"
    ],
    "archetypes": [],
    "displayName": "Ogun (Oggun, Ogum)",
    "domains": [
      "Ogun Onire (Ogun of Ire)",
      "Ogun Alara",
      "Ogun Onigbajamo",
      "Ogun Meji",
      "Osin Imole (Chief of the Orisha)",
      "Iron",
      "metalwork",
      "war",
      "hunting",
      "surgery",
      "technology",
      "labor",
      "justice",
      "truth",
      "clearing paths"
    ],
    "attributes": [],
    "symbols": [
      "Machete (Ida)",
      "anvil",
      "iron tools",
      "chains",
      "railroad spikes",
      "dog",
      "palm fronds",
      "7 (and 3)"
    ]
  },
  "name": "Ogun",
  "primarySources": [],
  "attributes": [],
  "id": "ogun",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "GR\n                Hephaestus\n                Greek - Smith",
      "link": "../../greek/deities/hephaestus.html"
    },
    {
      "type": "deity",
      "name": "RM\n                Vulcan\n                Roman - Forge",
      "link": "../../roman/deities/vulcan.html"
    },
    {
      "type": "deity",
      "name": "RM\n                Mars\n                Roman - War",
      "link": "../../roman/deities/mars.html"
    },
    {
      "type": "deity",
      "name": "NR\n                Thor\n                Norse - Strength",
      "link": "../../norse/deities/thor.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 3: oshun</summary>

```json
{
  "epithets": [
    "Yeye Kari (Mother of Riches)",
    "Iyalode (Queen of the Women)",
    "Laketi (She Who Responds)",
    "Yeye Osun (Mother Osun)",
    "Oore Yeye O (Kind Mother)"
  ],
  "displayName": "Oshun (Osun, Ochun, Oxum)",
  "description": "Orisha of Fresh Water, Love, Fertility, Beauty, and Prosperity",
  "domains": [
    "Yeye Kari (Mother of Riches)",
    "Iyalode (Queen of the Women)",
    "Laketi (She Who Responds)",
    "Yeye Osun (Mother Osun)",
    "Oore Yeye O (Kind Mother)",
    "Fresh water",
    "rivers",
    "love",
    "fertility",
    "beauty",
    "sensuality",
    "prosperity",
    "money",
    "diplomacy",
    "divination (diloggun)",
    "healing"
  ],
  "title": "Yoruba - Oshun - Orisha of Rivers, Love, and Beauty",
  "symbols": [
    "Honey",
    "mirror",
    "fan (abebe)",
    "peacock feathers",
    "gold jewelry",
    "brass",
    "pumpkin",
    "cowrie shells",
    "river stones",
    "5 (and multiples of 5)"
  ],
  "mythology": "yoruba",
  "relationships": {},
  "archetypes": [],
  "rawMetadata": {
    "relationships": {},
    "epithets": [
      "Yeye Kari (Mother of Riches)",
      "Iyalode (Queen of the Women)",
      "Laketi (She Who Responds)",
      "Yeye Osun (Mother Osun)",
      "Oore Yeye O (Kind Mother)"
    ],
    "archetypes": [],
    "displayName": "Oshun (Osun, Ochun, Oxum)",
    "domains": [
      "Yeye Kari (Mother of Riches)",
      "Iyalode (Queen of the Women)",
      "Laketi (She Who Responds)",
      "Yeye Osun (Mother Osun)",
      "Oore Yeye O (Kind Mother)",
      "Fresh water",
      "rivers",
      "love",
      "fertility",
      "beauty",
      "sensuality",
      "prosperity",
      "money",
      "diplomacy",
      "divination (diloggun)",
      "healing"
    ],
    "attributes": [],
    "symbols": [
      "Honey",
      "mirror",
      "fan (abebe)",
      "peacock feathers",
      "gold jewelry",
      "brass",
      "pumpkin",
      "cowrie shells",
      "river stones",
      "5 (and multiples of 5)"
    ]
  },
  "name": "Oshun",
  "primarySources": [],
  "attributes": [],
  "id": "oshun",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "GR\n                Aphrodite\n                Greek - Love",
      "link": "../../greek/deities/aphrodite.html"
    },
    {
      "type": "deity",
      "name": "RM\n                Venus\n                Roman - Beauty",
      "link": "../../roman/deities/venus.html"
    },
    {
      "type": "deity",
      "name": "NR\n                Freya\n                Norse - Love/Magic",
      "link": "../../norse/deities/freya.html"
    },
    {
      "type": "deity",
      "name": "BB\n                Ishtar\n                Babylonian - Love",
      "link": "../../babylonian/deities/ishtar.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 4: shango</summary>

```json
{
  "epithets": [
    "Oba Koso (The King Did Not Hang)",
    "Jakuta (Stone Thrower)",
    "Oba Gbodo Kole (The King Who Climbs to the Roof)",
    "Alagbara (The Powerful One)"
  ],
  "displayName": "Shango (Sango, Xango, Chango)",
  "description": "Orisha of Thunder, Lightning, Fire, and Divine Justice",
  "domains": [
    "Oba Koso (The King Did Not Hang)",
    "Jakuta (Stone Thrower)",
    "Oba Gbodo Kole (The King Who Climbs to the Roof)",
    "Alagbara (The Powerful One)",
    "Thunder",
    "lightning",
    "fire",
    "justice",
    "kingship",
    "dance",
    "drumming",
    "male virility",
    "strategy"
  ],
  "title": "Yoruba - Shango - Orisha of Thunder, Fire, and Justice",
  "symbols": [
    "Oshe (double-headed axe)",
    "thunderstones (edun ara)",
    "bata drums",
    "crown",
    "ram",
    "mortar",
    "6 (and 12)"
  ],
  "mythology": "yoruba",
  "relationships": {
    "mother": "torosi (nupe princess) or yemoja in some traditions",
    "children": [
      "alliances\n\nogun: fierce rivalry"
    ],
    "father": "oranmiyan (founder of oyo) in historical accounts; sometimes listed as obatala in purely mythological accounts"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "torosi (nupe princess) or yemoja in some traditions",
      "children": [
        "alliances\n\nogun: fierce rivalry"
      ],
      "father": "oranmiyan (founder of oyo) in historical accounts; sometimes listed as obatala in purely mythological accounts"
    },
    "epithets": [
      "Oba Koso (The King Did Not Hang)",
      "Jakuta (Stone Thrower)",
      "Oba Gbodo Kole (The King Who Climbs to the Roof)",
      "Alagbara (The Powerful One)"
    ],
    "archetypes": [],
    "displayName": "Shango (Sango, Xango, Chango)",
    "domains": [
      "Oba Koso (The King Did Not Hang)",
      "Jakuta (Stone Thrower)",
      "Oba Gbodo Kole (The King Who Climbs to the Roof)",
      "Alagbara (The Powerful One)",
      "Thunder",
      "lightning",
      "fire",
      "justice",
      "kingship",
      "dance",
      "drumming",
      "male virility",
      "strategy"
    ],
    "attributes": [],
    "symbols": [
      "Oshe (double-headed axe)",
      "thunderstones (edun ara)",
      "bata drums",
      "crown",
      "ram",
      "mortar",
      "6 (and 12)"
    ]
  },
  "name": "Shango",
  "primarySources": [],
  "attributes": [],
  "id": "shango",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "NR\n                Thor\n                Norse - Thunder",
      "link": "../../norse/deities/thor.html"
    },
    {
      "type": "deity",
      "name": "GR\n                Zeus\n                Greek - Thunder",
      "link": "../../greek/deities/zeus.html"
    },
    {
      "type": "deity",
      "name": "HN\n                Indra\n                Hindu - Storm",
      "link": "../../hindu/deities/indra.html"
    },
    {
      "type": "deity",
      "name": "RM\n                Jupiter\n                Roman - Thunder",
      "link": "../../roman/deities/jupiter.html"
    }
  ]
}
```

</details>

<details>
<summary>Document 5: yemoja</summary>

```json
{
  "epithets": [
    "Yeye Omo Eja (Mother Whose Children Are Fish)",
    "Mama Wata",
    "Olokun Omo (Child of Olokun)",
    "Yemowo",
    "Ibu"
  ],
  "displayName": "Yemoja (Yemoja, Yemaya, Iemanja)",
  "description": "Great Mother Orisha of the Ocean, Rivers, Fertility, and Motherhood",
  "domains": [
    "Yeye Omo Eja (Mother Whose Children Are Fish)",
    "Mama Wata",
    "Olokun Omo (Child of Olokun)",
    "Yemowo",
    "Ibu",
    "Ocean",
    "rivers",
    "motherhood",
    "fertility",
    "pregnancy",
    "childbirth",
    "women",
    "children",
    "the moon",
    "dreams",
    "the unconscious"
  ],
  "title": "Yoruba - Yemoja - Mother of Waters and Fertility",
  "symbols": [
    "Ocean waves",
    "fish",
    "seashells",
    "pearls",
    "mirrors",
    "fans",
    "anchor",
    "crescent moon",
    "mermaid imagery",
    "7 (and multiples of 7)"
  ],
  "mythology": "yoruba",
  "relationships": {
    "mother": "and daughter.",
    "consort": "in many traditions. their union represents the union of water and land"
  },
  "archetypes": [],
  "rawMetadata": {
    "relationships": {
      "mother": "and daughter.",
      "consort": "in many traditions. their union represents the union of water and land"
    },
    "epithets": [
      "Yeye Omo Eja (Mother Whose Children Are Fish)",
      "Mama Wata",
      "Olokun Omo (Child of Olokun)",
      "Yemowo",
      "Ibu"
    ],
    "archetypes": [],
    "displayName": "Yemoja (Yemoja, Yemaya, Iemanja)",
    "domains": [
      "Yeye Omo Eja (Mother Whose Children Are Fish)",
      "Mama Wata",
      "Olokun Omo (Child of Olokun)",
      "Yemowo",
      "Ibu",
      "Ocean",
      "rivers",
      "motherhood",
      "fertility",
      "pregnancy",
      "childbirth",
      "women",
      "children",
      "the moon",
      "dreams",
      "the unconscious"
    ],
    "attributes": [],
    "symbols": [
      "Ocean waves",
      "fish",
      "seashells",
      "pearls",
      "mirrors",
      "fans",
      "anchor",
      "crescent moon",
      "mermaid imagery",
      "7 (and multiples of 7)"
    ]
  },
  "name": "Yemoja",
  "primarySources": [],
  "attributes": [],
  "id": "yemoja",
  "relatedEntities": [
    {
      "type": "deity",
      "name": "EG\n                Isis\n                Egyptian - Mother",
      "link": "../../egyptian/deities/isis.html"
    },
    {
      "type": "deity",
      "name": "GR\n                Demeter\n                Greek - Mother",
      "link": "../../greek/deities/demeter.html"
    },
    {
      "type": "deity",
      "name": "CL\n                Danu\n                Celtic - Mother",
      "link": "../../celtic/deities/danu.html"
    },
    {
      "type": "deity",
      "name": "CH\n                Virgin Mary\n                Christian (syncretic)",
      "link": "../../christian/deities/virgin_mary.html"
    }
  ]
}
```

</details>

---

## 3. Documents Missing Mythology Organization

**Total:** 448 documents

### Collection: `archetypes`

4 documents missing mythology field:

- **Document ID:** `archetypes`
  - Fields: totalOccurrences, occurrences, metadata, mythologyCount, name, id
- **Document ID:** `hermetic`
  - Fields: totalOccurrences, occurrences, metadata, mythologyCount, name, id
- **Document ID:** `related-mythological-figures`
  - Fields: totalOccurrences, occurrences, metadata, mythologyCount, name, id
- **Document ID:** `world`
  - Fields: totalOccurrences, occurrences, metadata, mythologyCount, name, id

### Collection: `cross_references`

421 documents missing mythology field:

- **Document ID:** `aengus`
  - Fields: relatedContent, id
- **Document ID:** `ah-puch`
  - Fields: relatedContent, id
- **Document ID:** `ahura-mazda`
  - Fields: relatedContent, id
- **Document ID:** `allah`
  - Fields: relatedContent, id
- **Document ID:** `amaterasu`
  - Fields: id, relatedContent
- **Document ID:** `amesha-spentas`
  - Fields: relatedContent, id
- **Document ID:** `amun-ra`
  - Fields: id, relatedContent
- **Document ID:** `an`
  - Fields: id, relatedContent
- **Document ID:** `anahita`
  - Fields: relatedContent, id
- **Document ID:** `angra-mainyu`
  - Fields: relatedContent, id
- **Document ID:** `anhur`
  - Fields: id, relatedContent
- **Document ID:** `anubis`
  - Fields: id, relatedContent
- **Document ID:** `apep`
  - Fields: id, relatedContent
- **Document ID:** `aphrodite`
  - Fields: relatedContent, id
- **Document ID:** `apollo`
  - Fields: relatedContent, id
- **Document ID:** `ares`
  - Fields: relatedContent, id
- **Document ID:** `artemis`
  - Fields: relatedContent, id
- **Document ID:** `atar`
  - Fields: relatedContent, id
- **Document ID:** `athena`
  - Fields: relatedContent, id
- **Document ID:** `atum`
  - Fields: id, relatedContent
- **Document ID:** `avalokiteshvara`
  - Fields: id, relatedContent
- **Document ID:** `avalokiteshvara_detailed`
  - Fields: id, relatedContent
- **Document ID:** `babylonian_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_akitu`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_apsu`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_creation`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_divination`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_gilgamesh`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_hammurabi`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_mushussu`
  - Fields: relatedContent, id
- **Document ID:** `babylonian_scorpion-men`
  - Fields: relatedContent, id
- **Document ID:** `bacchus`
  - Fields: relatedContent, id
- **Document ID:** `baldr`
  - Fields: id, relatedContent
- **Document ID:** `bastet`
  - Fields: id, relatedContent
- **Document ID:** `brahma`
  - Fields: relatedContent, id
- **Document ID:** `brigid`
  - Fields: relatedContent, id
- **Document ID:** `buddha`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_bodhi`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_bodhisattva`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_calendar`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_compassion`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_creation`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_dalai_lama`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_dependent_origination`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_karma`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_king_songtsen_gampo`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_klesha`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_lotus`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_nagarjuna`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_nagas`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_nirvana`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_offerings`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_potala_palace`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_preparations`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_realms`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_samsara`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_sandalwood`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_shantideva`
  - Fields: relatedContent, id
- **Document ID:** `buddhist_tsongkhapa`
  - Fields: relatedContent, id
- **Document ID:** `celtic_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `celtic_creation`
  - Fields: relatedContent, id
- **Document ID:** `ceres`
  - Fields: relatedContent, id
- **Document ID:** `cernunnos`
  - Fields: relatedContent, id
- **Document ID:** `chaac`
  - Fields: relatedContent, id
- **Document ID:** `chinese_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `chinese_creation`
  - Fields: relatedContent, id
- **Document ID:** `christian_144000`
  - Fields: relatedContent, id
- **Document ID:** `christian_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `christian_andrew`
  - Fields: relatedContent, id
- **Document ID:** `christian_angels`
  - Fields: relatedContent, id
- **Document ID:** `christian_babylon-fall-detailed`
  - Fields: relatedContent, id
- **Document ID:** `christian_babylon-falls`
  - Fields: relatedContent, id
- **Document ID:** `christian_baptism`
  - Fields: relatedContent, id
- **Document ID:** `christian_beast-kingdoms-progression`
  - Fields: relatedContent, id
- **Document ID:** `christian_christ-returns`
  - Fields: relatedContent, id
- **Document ID:** `christian_covenant-formulas`
  - Fields: relatedContent, id
- **Document ID:** `christian_creation`
  - Fields: relatedContent, id
- **Document ID:** `christian_daniel`
  - Fields: relatedContent, id
- **Document ID:** `christian_daniel-parallels`
  - Fields: relatedContent, id
- **Document ID:** `christian_demiurge-vs-monad`
  - Fields: relatedContent, id
- **Document ID:** `christian_elijah`
  - Fields: relatedContent, id
- **Document ID:** `christian_exodus-parallels`
  - Fields: relatedContent, id
- **Document ID:** `christian_ezekiel-parallels`
  - Fields: relatedContent, id
- **Document ID:** `christian_four-horsemen`
  - Fields: relatedContent, id
- **Document ID:** `christian_four-living-creatures`
  - Fields: relatedContent, id
- **Document ID:** `christian_furnace-and-fire-judgments`
  - Fields: relatedContent, id
- **Document ID:** `christian_gog-magog`
  - Fields: relatedContent, id
- **Document ID:** `christian_grace`
  - Fields: relatedContent, id
- **Document ID:** `christian_heaven`
  - Fields: relatedContent, id
- **Document ID:** `christian_heavenly-throne`
  - Fields: relatedContent, id
- **Document ID:** `christian_hierarchy`
  - Fields: relatedContent, id
- **Document ID:** `christian_incarnation`
  - Fields: relatedContent, id
- **Document ID:** `christian_isaiah-parallels`
  - Fields: relatedContent, id
- **Document ID:** `christian_james-son-of-zebedee`
  - Fields: relatedContent, id
- **Document ID:** `christian_joel-parallels`
  - Fields: relatedContent, id
- **Document ID:** `christian_john`
  - Fields: relatedContent, id
- **Document ID:** `christian_mark-of-beast`
  - Fields: relatedContent, id
- **Document ID:** `christian_millennium`
  - Fields: relatedContent, id
- **Document ID:** `christian_moses`
  - Fields: relatedContent, id
- **Document ID:** `christian_names-and-titles`
  - Fields: relatedContent, id
- **Document ID:** `christian_new-creation`
  - Fields: relatedContent, id
- **Document ID:** `christian_new-jerusalem`
  - Fields: relatedContent, id
- **Document ID:** `christian_peter`
  - Fields: relatedContent, id
- **Document ID:** `christian_resurrection`
  - Fields: relatedContent, id
- **Document ID:** `christian_sacraments`
  - Fields: id, relatedContent
- **Document ID:** `christian_salvation`
  - Fields: relatedContent, id
- **Document ID:** `christian_seraphim`
  - Fields: relatedContent, id
- **Document ID:** `christian_seven-bowls`
  - Fields: relatedContent, id
- **Document ID:** `christian_seven-churches`
  - Fields: relatedContent, id
- **Document ID:** `christian_seven-patterns`
  - Fields: relatedContent, id
- **Document ID:** `christian_seven-seals`
  - Fields: relatedContent, id
- **Document ID:** `christian_seven-trumpets`
  - Fields: relatedContent, id
- **Document ID:** `christian_structure`
  - Fields: relatedContent, id
- **Document ID:** `christian_symbolism`
  - Fields: relatedContent, id
- **Document ID:** `christian_trinity`
  - Fields: relatedContent, id
- **Document ID:** `christian_two-beasts`
  - Fields: relatedContent, id
- **Document ID:** `christian_woman-and-dragon`
  - Fields: relatedContent, id
- **Document ID:** `christian_zechariah-parallels`
  - Fields: relatedContent, id
- **Document ID:** `coatlicue`
  - Fields: relatedContent, id
- **Document ID:** `cronos`
  - Fields: relatedContent, id
- **Document ID:** `cupid`
  - Fields: relatedContent, id
- **Document ID:** `dagda`
  - Fields: relatedContent, id
- **Document ID:** `danu`
  - Fields: relatedContent, id
- **Document ID:** `demeter`
  - Fields: relatedContent, id
- **Document ID:** `dhanvantari`
  - Fields: relatedContent, id
- **Document ID:** `diana`
  - Fields: relatedContent, id
- **Document ID:** `dionysus`
  - Fields: relatedContent, id
- **Document ID:** `dragon-kings`
  - Fields: relatedContent, id
- **Document ID:** `dumuzi`
  - Fields: id, relatedContent
- **Document ID:** `durga`
  - Fields: relatedContent, id
- **Document ID:** `dyaus`
  - Fields: relatedContent, id
- **Document ID:** `ea`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_amduat`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_creation`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_creation-myths`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_duat`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_ennead`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_lotus`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_maat`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_mummification`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_nun`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_opet-festival`
  - Fields: relatedContent, id
- **Document ID:** `egyptian_sphinx`
  - Fields: relatedContent, id
- **Document ID:** `eir`
  - Fields: id, relatedContent
- **Document ID:** `empress`
  - Fields: relatedContent, id
- **Document ID:** `enki`
  - Fields: id, relatedContent
- **Document ID:** `enlil`
  - Fields: id, relatedContent
- **Document ID:** `ereshkigal`
  - Fields: id, relatedContent
- **Document ID:** `erlang-shen`
  - Fields: id, relatedContent
- **Document ID:** `eros`
  - Fields: relatedContent, id
- **Document ID:** `eshu`
  - Fields: relatedContent, id
- **Document ID:** `fool`
  - Fields: relatedContent, id
- **Document ID:** `fortuna`
  - Fields: relatedContent, id
- **Document ID:** `freya`
  - Fields: id, relatedContent
- **Document ID:** `freyja`
  - Fields: id, relatedContent
- **Document ID:** `frigg`
  - Fields: id, relatedContent
- **Document ID:** `gabriel`
  - Fields: id, relatedContent
- **Document ID:** `gaia`
  - Fields: relatedContent, id
- **Document ID:** `ganesha`
  - Fields: relatedContent, id
- **Document ID:** `gautama_buddha`
  - Fields: id, relatedContent
- **Document ID:** `geb`
  - Fields: id, relatedContent
- **Document ID:** `god-father`
  - Fields: id, relatedContent
- **Document ID:** `greek_achilles`
  - Fields: relatedContent, id
- **Document ID:** `greek_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `greek_ambrosia`
  - Fields: relatedContent, id
- **Document ID:** `greek_chimera`
  - Fields: relatedContent, id
- **Document ID:** `greek_creation`
  - Fields: relatedContent, id
- **Document ID:** `greek_dionysian-rites`
  - Fields: relatedContent, id
- **Document ID:** `greek_eleusinian-mysteries`
  - Fields: relatedContent, id
- **Document ID:** `greek_eros-psyche`
  - Fields: relatedContent, id
- **Document ID:** `greek_heracles`
  - Fields: relatedContent, id
- **Document ID:** `greek_hydra`
  - Fields: relatedContent, id
- **Document ID:** `greek_jason`
  - Fields: relatedContent, id
- **Document ID:** `greek_judgment-of-paris`
  - Fields: relatedContent, id
- **Document ID:** `greek_laurel`
  - Fields: relatedContent, id
- **Document ID:** `greek_medusa`
  - Fields: relatedContent, id
- **Document ID:** `greek_minotaur`
  - Fields: relatedContent, id
- **Document ID:** `greek_mount-olympus`
  - Fields: relatedContent, id
- **Document ID:** `greek_myrtle`
  - Fields: relatedContent, id
- **Document ID:** `greek_oak`
  - Fields: relatedContent, id
- **Document ID:** `greek_odysseus`
  - Fields: relatedContent, id
- **Document ID:** `greek_offerings`
  - Fields: relatedContent, id
- **Document ID:** `greek_olive`
  - Fields: relatedContent, id
- **Document ID:** `greek_olympic-games`
  - Fields: relatedContent, id
- **Document ID:** `greek_orpheus`
  - Fields: id, relatedContent
- **Document ID:** `greek_pegasus`
  - Fields: relatedContent, id
- **Document ID:** `greek_persephone`
  - Fields: relatedContent, id
- **Document ID:** `greek_perseus`
  - Fields: relatedContent, id
- **Document ID:** `greek_pomegranate`
  - Fields: relatedContent, id
- **Document ID:** `greek_primordials`
  - Fields: relatedContent, id
- **Document ID:** `greek_sphinx`
  - Fields: relatedContent, id
- **Document ID:** `greek_stymphalian-birds`
  - Fields: relatedContent, id
- **Document ID:** `greek_theseus`
  - Fields: relatedContent, id
- **Document ID:** `greek_titans`
  - Fields: relatedContent, id
- **Document ID:** `greek_underworld`
  - Fields: relatedContent, id
- **Document ID:** `guan-yu`
  - Fields: relatedContent, id
- **Document ID:** `guanyin`
  - Fields: relatedContent, id
- **Document ID:** `hades`
  - Fields: relatedContent, id
- **Document ID:** `hanuman`
  - Fields: relatedContent, id
- **Document ID:** `hathor`
  - Fields: id, relatedContent
- **Document ID:** `heimdall`
  - Fields: id, relatedContent
- **Document ID:** `hel`
  - Fields: id, relatedContent
- **Document ID:** `hephaestus`
  - Fields: relatedContent, id
- **Document ID:** `hera`
  - Fields: relatedContent, id
- **Document ID:** `hermes`
  - Fields: relatedContent, id
- **Document ID:** `hestia`
  - Fields: id, relatedContent
- **Document ID:** `high-priestess`
  - Fields: relatedContent, id
- **Document ID:** `hindu_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `hindu_brahma`
  - Fields: relatedContent, id
- **Document ID:** `hindu_creation`
  - Fields: relatedContent, id
- **Document ID:** `hindu_diwali`
  - Fields: relatedContent, id
- **Document ID:** `hindu_garuda`
  - Fields: relatedContent, id
- **Document ID:** `hindu_karma`
  - Fields: relatedContent, id
- **Document ID:** `hindu_krishna`
  - Fields: relatedContent, id
- **Document ID:** `hindu_kshira-sagara`
  - Fields: relatedContent, id
- **Document ID:** `hindu_makara`
  - Fields: relatedContent, id
- **Document ID:** `hindu_nagas`
  - Fields: relatedContent, id
- **Document ID:** `hindu_rama`
  - Fields: relatedContent, id
- **Document ID:** `hindu_shiva`
  - Fields: relatedContent, id
- **Document ID:** `hindu_soma`
  - Fields: relatedContent, id
- **Document ID:** `hindu_vishnu`
  - Fields: relatedContent, id
- **Document ID:** `hod`
  - Fields: id, relatedContent
- **Document ID:** `holy-spirit`
  - Fields: id, relatedContent
- **Document ID:** `horus`
  - Fields: id, relatedContent
- **Document ID:** `huitzilopochtli`
  - Fields: relatedContent, id
- **Document ID:** `imhotep`
  - Fields: id, relatedContent
- **Document ID:** `inanna`
  - Fields: id, relatedContent
- **Document ID:** `inari`
  - Fields: id, relatedContent
- **Document ID:** `indra`
  - Fields: relatedContent, id
- **Document ID:** `ishtar`
  - Fields: relatedContent, id
- **Document ID:** `isis`
  - Fields: id, relatedContent
- **Document ID:** `islamic_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `islamic_black-seed`
  - Fields: relatedContent, id
- **Document ID:** `islamic_creation`
  - Fields: relatedContent, id
- **Document ID:** `islamic_ibrahim`
  - Fields: relatedContent, id
- **Document ID:** `islamic_isa`
  - Fields: relatedContent, id
- **Document ID:** `islamic_jinn`
  - Fields: relatedContent, id
- **Document ID:** `islamic_miswak`
  - Fields: relatedContent, id
- **Document ID:** `islamic_musa`
  - Fields: relatedContent, id
- **Document ID:** `islamic_nuh`
  - Fields: relatedContent, id
- **Document ID:** `islamic_salat`
  - Fields: relatedContent, id
- **Document ID:** `islamic_senna`
  - Fields: relatedContent, id
- **Document ID:** `islamic_tawhid`
  - Fields: relatedContent, id
- **Document ID:** `itzamna`
  - Fields: relatedContent, id
- **Document ID:** `ixchel`
  - Fields: relatedContent, id
- **Document ID:** `izanagi`
  - Fields: id, relatedContent
- **Document ID:** `izanami`
  - Fields: id, relatedContent
- **Document ID:** `jade-emperor`
  - Fields: relatedContent, id
- **Document ID:** `janus`
  - Fields: relatedContent, id
- **Document ID:** `japanese_amaterasu-cave`
  - Fields: relatedContent, id
- **Document ID:** `japanese_creation-of-japan`
  - Fields: relatedContent, id
- **Document ID:** `japanese_izanagi-yomi`
  - Fields: relatedContent, id
- **Document ID:** `japanese_susanoo-orochi`
  - Fields: relatedContent, id
- **Document ID:** `jesus-christ`
  - Fields: id, relatedContent
- **Document ID:** `jesus_christ`
  - Fields: id, relatedContent
- **Document ID:** `jewish_1-enoch-heavenly-journeys`
  - Fields: relatedContent, id
- **Document ID:** `jewish_abraham`
  - Fields: relatedContent, id
- **Document ID:** `jewish_assumption-tradition`
  - Fields: relatedContent, id
- **Document ID:** `jewish_circumcision-parallels`
  - Fields: relatedContent, id
- **Document ID:** `jewish_egyptian-monotheism`
  - Fields: relatedContent, id
- **Document ID:** `jewish_enoch-calendar`
  - Fields: relatedContent, id
- **Document ID:** `jewish_enoch-hermes-thoth`
  - Fields: relatedContent, id
- **Document ID:** `jewish_enoch-islam`
  - Fields: relatedContent, id
- **Document ID:** `jewish_enoch-pseudepigrapha`
  - Fields: relatedContent, id
- **Document ID:** `jewish_flood-myths-ane`
  - Fields: relatedContent, id
- **Document ID:** `jewish_genesis-enoch`
  - Fields: relatedContent, id
- **Document ID:** `jewish_magician-showdown`
  - Fields: relatedContent, id
- **Document ID:** `jewish_metatron-transformation`
  - Fields: relatedContent, id
- **Document ID:** `jewish_moses`
  - Fields: relatedContent, id
- **Document ID:** `jewish_moses-horus-parallels`
  - Fields: relatedContent, id
- **Document ID:** `jewish_plagues-egyptian-gods`
  - Fields: relatedContent, id
- **Document ID:** `jewish_potter-and-clay`
  - Fields: relatedContent, id
- **Document ID:** `jewish_reed-symbolism`
  - Fields: relatedContent, id
- **Document ID:** `jewish_seven-seals`
  - Fields: relatedContent, id
- **Document ID:** `jewish_tiamat-and-tehom`
  - Fields: relatedContent, id
- **Document ID:** `jewish_virgin-births`
  - Fields: relatedContent, id
- **Document ID:** `jibreel`
  - Fields: relatedContent, id
- **Document ID:** `jord`
  - Fields: id, relatedContent
- **Document ID:** `juno`
  - Fields: relatedContent, id
- **Document ID:** `jupiter`
  - Fields: relatedContent, id
- **Document ID:** `kali`
  - Fields: relatedContent, id
- **Document ID:** `kartikeya`
  - Fields: relatedContent, id
- **Document ID:** `krishna`
  - Fields: relatedContent, id
- **Document ID:** `kukulkan`
  - Fields: relatedContent, id
- **Document ID:** `lakshmi`
  - Fields: relatedContent, id
- **Document ID:** `laufey`
  - Fields: id, relatedContent
- **Document ID:** `loki`
  - Fields: id, relatedContent
- **Document ID:** `lovers`
  - Fields: relatedContent, id
- **Document ID:** `lugh`
  - Fields: relatedContent, id
- **Document ID:** `maat`
  - Fields: id, relatedContent
- **Document ID:** `magician`
  - Fields: relatedContent, id
- **Document ID:** `manannan`
  - Fields: relatedContent, id
- **Document ID:** `manjushri`
  - Fields: id, relatedContent
- **Document ID:** `manjushri_detailed`
  - Fields: id, relatedContent
- **Document ID:** `marduk`
  - Fields: relatedContent, id
- **Document ID:** `mars`
  - Fields: relatedContent, id
- **Document ID:** `mercury`
  - Fields: relatedContent, id
- **Document ID:** `michael`
  - Fields: id, relatedContent
- **Document ID:** `minerva`
  - Fields: relatedContent, id
- **Document ID:** `mithra`
  - Fields: relatedContent, id
- **Document ID:** `montu`
  - Fields: id, relatedContent
- **Document ID:** `morrigan`
  - Fields: relatedContent, id
- **Document ID:** `muhammad`
  - Fields: relatedContent, id
- **Document ID:** `nabu`
  - Fields: relatedContent, id
- **Document ID:** `nari`
  - Fields: id, relatedContent
- **Document ID:** `neith`
  - Fields: id, relatedContent
- **Document ID:** `nephthys`
  - Fields: id, relatedContent
- **Document ID:** `neptune`
  - Fields: relatedContent, id
- **Document ID:** `nergal`
  - Fields: relatedContent, id
- **Document ID:** `nezha`
  - Fields: relatedContent, id
- **Document ID:** `norse_aesir`
  - Fields: relatedContent, id
- **Document ID:** `norse_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `norse_asgard`
  - Fields: id, relatedContent
- **Document ID:** `norse_ash`
  - Fields: relatedContent, id
- **Document ID:** `norse_blot`
  - Fields: relatedContent, id
- **Document ID:** `norse_creation`
  - Fields: relatedContent, id
- **Document ID:** `norse_elder`
  - Fields: relatedContent, id
- **Document ID:** `norse_jotnar`
  - Fields: relatedContent, id
- **Document ID:** `norse_mugwort`
  - Fields: relatedContent, id
- **Document ID:** `norse_ragnarok`
  - Fields: id, relatedContent
- **Document ID:** `norse_sigurd`
  - Fields: relatedContent, id
- **Document ID:** `norse_svadilfari`
  - Fields: relatedContent, id
- **Document ID:** `norse_yarrow`
  - Fields: relatedContent, id
- **Document ID:** `norse_yew`
  - Fields: relatedContent, id
- **Document ID:** `norse_yggdrasil`
  - Fields: relatedContent, id
- **Document ID:** `nuada`
  - Fields: relatedContent, id
- **Document ID:** `nut`
  - Fields: id, relatedContent
- **Document ID:** `odin`
  - Fields: id, relatedContent
- **Document ID:** `ogma`
  - Fields: relatedContent, id
- **Document ID:** `ogun`
  - Fields: relatedContent, id
- **Document ID:** `oshun`
  - Fields: relatedContent, id
- **Document ID:** `osiris`
  - Fields: id, relatedContent
- **Document ID:** `parvati`
  - Fields: relatedContent, id
- **Document ID:** `persephone`
  - Fields: relatedContent, id
- **Document ID:** `persian_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `persian_asha`
  - Fields: relatedContent, id
- **Document ID:** `persian_chinvat-bridge`
  - Fields: relatedContent, id
- **Document ID:** `persian_creation`
  - Fields: relatedContent, id
- **Document ID:** `persian_div`
  - Fields: relatedContent, id
- **Document ID:** `persian_druj`
  - Fields: relatedContent, id
- **Document ID:** `persian_faravahar`
  - Fields: relatedContent, id
- **Document ID:** `persian_fire-worship`
  - Fields: relatedContent, id
- **Document ID:** `persian_frashokereti`
  - Fields: relatedContent, id
- **Document ID:** `persian_haoma`
  - Fields: relatedContent, id
- **Document ID:** `persian_sacred-fire`
  - Fields: relatedContent, id
- **Document ID:** `persian_threefold-path`
  - Fields: relatedContent, id
- **Document ID:** `persian_zoroaster`
  - Fields: relatedContent, id
- **Document ID:** `pluto`
  - Fields: relatedContent, id
- **Document ID:** `poseidon`
  - Fields: relatedContent, id
- **Document ID:** `prithvi`
  - Fields: relatedContent, id
- **Document ID:** `prometheus`
  - Fields: relatedContent, id
- **Document ID:** `proserpina`
  - Fields: relatedContent, id
- **Document ID:** `ptah`
  - Fields: id, relatedContent
- **Document ID:** `quetzalcoatl`
  - Fields: relatedContent, id
- **Document ID:** `ra`
  - Fields: id, relatedContent
- **Document ID:** `raphael`
  - Fields: id, relatedContent
- **Document ID:** `rashnu`
  - Fields: relatedContent, id
- **Document ID:** `rati`
  - Fields: relatedContent, id
- **Document ID:** `roman_aeneas`
  - Fields: relatedContent, id
- **Document ID:** `roman_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `roman_calendar`
  - Fields: relatedContent, id
- **Document ID:** `roman_creation`
  - Fields: relatedContent, id
- **Document ID:** `roman_offerings`
  - Fields: relatedContent, id
- **Document ID:** `roman_triumph`
  - Fields: relatedContent, id
- **Document ID:** `saraswati`
  - Fields: relatedContent, id
- **Document ID:** `satis`
  - Fields: id, relatedContent
- **Document ID:** `saturn`
  - Fields: relatedContent, id
- **Document ID:** `sekhmet`
  - Fields: id, relatedContent
- **Document ID:** `set`
  - Fields: id, relatedContent
- **Document ID:** `shamash`
  - Fields: relatedContent, id
- **Document ID:** `shango`
  - Fields: relatedContent, id
- **Document ID:** `shiva`
  - Fields: relatedContent, id
- **Document ID:** `sin`
  - Fields: relatedContent, id
- **Document ID:** `skadi`
  - Fields: id, relatedContent
- **Document ID:** `sobek`
  - Fields: id, relatedContent
- **Document ID:** `sraosha`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_anunnaki`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_creation`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_gilgamesh`
  - Fields: id, relatedContent
- **Document ID:** `sumerian_inanna-descent`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_lamassu`
  - Fields: relatedContent, id
- **Document ID:** `sumerian_me`
  - Fields: relatedContent, id
- **Document ID:** `susanoo`
  - Fields: id, relatedContent
- **Document ID:** `tarot_afterlife`
  - Fields: relatedContent, id
- **Document ID:** `tarot_angel`
  - Fields: relatedContent, id
- **Document ID:** `tarot_bull`
  - Fields: relatedContent, id
- **Document ID:** `tarot_celtic-cross`
  - Fields: relatedContent, id
- **Document ID:** `tarot_creation`
  - Fields: relatedContent, id
- **Document ID:** `tarot_eagle`
  - Fields: relatedContent, id
- **Document ID:** `tarot_kerubim`
  - Fields: relatedContent, id
- **Document ID:** `tarot_lion`
  - Fields: relatedContent, id
- **Document ID:** `tarot_tree-of-life`
  - Fields: relatedContent, id
- **Document ID:** `tefnut`
  - Fields: id, relatedContent
- **Document ID:** `tezcatlipoca`
  - Fields: relatedContent, id
- **Document ID:** `thanatos`
  - Fields: relatedContent, id
- **Document ID:** `thor`
  - Fields: id, relatedContent
- **Document ID:** `thoth`
  - Fields: id, relatedContent
- **Document ID:** `tiamat`
  - Fields: relatedContent, id
- **Document ID:** `tlaloc`
  - Fields: relatedContent, id
- **Document ID:** `tsukuyomi`
  - Fields: id, relatedContent
- **Document ID:** `tyr`
  - Fields: id, relatedContent
- **Document ID:** `uranus`
  - Fields: relatedContent, id
- **Document ID:** `utu`
  - Fields: id, relatedContent
- **Document ID:** `vali`
  - Fields: id, relatedContent
- **Document ID:** `venus`
  - Fields: relatedContent, id
- **Document ID:** `vesta`
  - Fields: id, relatedContent
- **Document ID:** `virgin_mary`
  - Fields: id, relatedContent
- **Document ID:** `vishnu`
  - Fields: relatedContent, id
- **Document ID:** `vritra`
  - Fields: relatedContent, id
- **Document ID:** `vulcan`
  - Fields: relatedContent, id
- **Document ID:** `world`
  - Fields: relatedContent, id
- **Document ID:** `xi-wangmu`
  - Fields: relatedContent, id
- **Document ID:** `yama`
  - Fields: relatedContent, id
- **Document ID:** `yamantaka`
  - Fields: id, relatedContent
- **Document ID:** `yami`
  - Fields: relatedContent, id
- **Document ID:** `yemoja`
  - Fields: relatedContent, id
- **Document ID:** `zao-jun`
  - Fields: relatedContent, id
- **Document ID:** `zeus`
  - Fields: relatedContent, id

### Collection: `mythologies`

22 documents missing mythology field:

- **Document ID:** `apocryphal`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `aztec`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `babylonian`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `buddhist`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `celtic`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `chinese`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `christian`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `comparative`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `egyptian`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `greek`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `hindu`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `islamic`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `japanese`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `jewish`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `mayan`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `native_american`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `norse`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `persian`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `roman`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `sumerian`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `tarot`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections
- **Document ID:** `yoruba`
  - Fields: metadata, stats, displayName, icon, description, heroTitle, id, sections

### Collection: `users`

1 documents missing mythology field:

- **Document ID:** `I80OwUmlALVg2KMpr8gDNLmwVmW2`
  - Fields: avatar, email, username, createdAt, photoURL, displayName, updatedAt

---

## 4. Schema Inconsistencies

Found schema inconsistencies in 1 collection(s):

### Collection: `search_index`

**3** different schema variations found:

#### Variation 1
Fields: autocompletePrefixes, contentType, createdAt, description, displayName, id, metadata, mythology, name, qualityScore, searchTokens, sourceFile, tags

#### Variation 2
Fields: archetypes, description, displayName, domains, id, metadata, mythology, name, searchTerms, type

#### Variation 3
Fields: description, id, metadata, mythology, name, searchTerms, type

---

## 5. Asset Distribution by Mythology

### apocryphal

- **search_index:** 1 documents

### aztec

- **aztec:** 5 documents
- **deities:** 5 documents
- **search_index:** 11 documents

### babylonian

- **babylonian:** 8 documents
- **cosmology:** 3 documents
- **creatures:** 2 documents
- **deities:** 8 documents
- **heroes:** 2 documents
- **rituals:** 2 documents
- **search_index:** 26 documents

### buddhist

- **buddhist:** 8 documents
- **concepts:** 2 documents
- **cosmology:** 9 documents
- **creatures:** 1 documents
- **deities:** 8 documents
- **herbs:** 4 documents
- **heroes:** 5 documents
- **rituals:** 2 documents
- **search_index:** 39 documents

### celtic

- **celtic:** 10 documents
- **cosmology:** 2 documents
- **deities:** 10 documents
- **search_index:** 23 documents

### chinese

- **chinese:** 8 documents
- **cosmology:** 2 documents
- **deities:** 8 documents
- **search_index:** 19 documents

### christian

- **christian:** 8 documents
- **concepts:** 1 documents
- **cosmology:** 8 documents
- **creatures:** 3 documents
- **deities:** 8 documents
- **heroes:** 7 documents
- **rituals:** 2 documents
- **search_index:** 69 documents
- **texts:** 31 documents

### comparative

- **search_index:** 1 documents

### egyptian

- **concepts:** 1 documents
- **cosmology:** 6 documents
- **creatures:** 1 documents
- **deities:** 25 documents
- **egyptian:** 25 documents
- **herbs:** 1 documents
- **rituals:** 2 documents
- **search_index:** 63 documents
- **texts:** 1 documents

### freemasons

- **search_index:** 1 documents

### greek

- **concepts:** 3 documents
- **cosmology:** 6 documents
- **creatures:** 7 documents
- **deities:** 22 documents
- **greek:** 22 documents
- **herbs:** 6 documents
- **heroes:** 8 documents
- **rituals:** 4 documents
- **search_index:** 76 documents

### hindu

- **cosmology:** 5 documents
- **creatures:** 6 documents
- **deities:** 20 documents
- **herbs:** 1 documents
- **heroes:** 2 documents
- **hindu:** 20 documents
- **rituals:** 1 documents
- **search_index:** 55 documents

### islamic

- **cosmology:** 3 documents
- **creatures:** 1 documents
- **deities:** 3 documents
- **herbs:** 3 documents
- **heroes:** 4 documents
- **islamic:** 3 documents
- **rituals:** 1 documents
- **search_index:** 19 documents

### japanese

- **concepts:** 4 documents
- **deities:** 6 documents
- **japanese:** 6 documents
- **search_index:** 17 documents

### jewish

- **heroes:** 18 documents
- **search_index:** 22 documents
- **texts:** 3 documents

### mayan

- **deities:** 5 documents
- **mayan:** 5 documents
- **search_index:** 11 documents

### native_american

- **search_index:** 1 documents

### norse

- **concepts:** 2 documents
- **cosmology:** 5 documents
- **creatures:** 2 documents
- **deities:** 17 documents
- **herbs:** 6 documents
- **heroes:** 1 documents
- **norse:** 17 documents
- **rituals:** 1 documents
- **search_index:** 50 documents

### persian

- **cosmology:** 7 documents
- **creatures:** 1 documents
- **deities:** 8 documents
- **herbs:** 1 documents
- **heroes:** 1 documents
- **persian:** 8 documents
- **rituals:** 1 documents
- **search_index:** 30 documents
- **symbols:** 2 documents

### roman

- **cosmology:** 2 documents
- **deities:** 19 documents
- **heroes:** 1 documents
- **rituals:** 3 documents
- **roman:** 19 documents
- **search_index:** 45 documents

### sumerian

- **concepts:** 2 documents
- **cosmology:** 4 documents
- **creatures:** 1 documents
- **deities:** 7 documents
- **heroes:** 1 documents
- **search_index:** 22 documents
- **sumerian:** 7 documents

### tarot

- **cosmology:** 3 documents
- **creatures:** 5 documents
- **deities:** 6 documents
- **rituals:** 1 documents
- **search_index:** 22 documents
- **tarot:** 6 documents

### yoruba

- **deities:** 5 documents
- **search_index:** 11 documents
- **yoruba:** 5 documents

---

## 6. Recommendations for Centralized Structure

### Current Issues

1. **Missing Mythology Organization:** 448 documents lack mythology-based organization
2. **Schema Inconsistencies:** 1 collections have inconsistent schemas
3. **Multiple Root Collections:** 32 separate collections instead of unified structure

### Proposed Centralized Structure

Recommend migrating to a hierarchical structure:

```
mythologies/
  {mythologyId}/
    assets/
      {assetId} - { type, name, url, metadata... }
    entities/
      {entityId} - { name, description, relationships... }
    content/
      {contentId} - { title, body, category... }
```

### Migration Benefits

1. **Unified Access:** All mythology data organized under single root
2. **Consistent Queries:** Easier to query across mythologies
3. **Better Scaling:** Clear hierarchy supports growth
4. **Schema Enforcement:** Easier to enforce consistent schemas
5. **Mythology Isolation:** Each mythology's data is self-contained

### Recommended Actions

1. **Create Base Structure:** Set up `mythologies/{mythologyId}` root
2. **Standardize Schemas:** Define consistent schema for each asset type
3. **Migrate Documents:** Move existing documents to new structure
4. **Add Mythology Fields:** Ensure all documents have mythology identifier
5. **Update Application Code:** Modify queries to use new structure
6. **Verify Migration:** Test all functionality with new structure
7. **Clean Up:** Remove old collections after verification

---

*End of Analysis Report*
