# Enhanced Deity Fields Reference Guide

This document describes the culture-specific fields added to deity JSON files for Chinese, Japanese, Aztec, and Mayan mythologies.

---

## Chinese Deities (`chinese_specific`)

### Structure:
```json
"chinese_specific": {
  "characters": {
    "chinese": "观音 / 観音",
    "pinyin": "Guān Yīn"
  },
  "corpus_terms": [
    "观音 Guanyin (Simplified)",
    "観音 Guanyin (Traditional)",
    "观世音 (Perceiver of Sounds)"
  ],
  "temples": [
    "Mount Putuo - Guanyin's earthly abode"
  ],
  "associations": {
    "buddhist": true,
    "daoist": false
  }
}
```

### Field Descriptions:

#### `characters`
- **chinese**: Chinese characters (may include both simplified and traditional)
- **pinyin**: Romanized pronunciation with tone marks

#### `corpus_terms`
Array of searchable Chinese terms found in the corpus:
- Simplified characters
- Traditional characters
- Alternative names
- Related concepts (e.g., 菩萨 Bodhisattva, 大悲咒 Great Compassion Mantra)

#### `temples`
Array of sacred sites and temples associated with the deity:
- Major pilgrimage sites
- Important temples
- Sacred mountains

#### `associations`
Boolean flags for religious traditions:
- **buddhist**: Deity is part of Chinese Buddhism
- **daoist**: Deity is part of Daoism/Taoism
- Deities can be both (syncretism is common)

---

## Japanese Deities (`japanese_specific`)

### Structure:
```json
"japanese_specific": {
  "kanji": {
    "kanji": "天照大神",
    "romanization": "Amaterasu-Omikami"
  },
  "shrines": [
    "The Grand Shrine of Ise (Ise Jingu)",
    "Amanoiwato Shrine (Takachiho, Miyazaki)"
  ],
  "sacred_texts": [
    "Kojiki (712 CE)",
    "Nihon Shoki (720 CE)",
    "Engishiki"
  ],
  "festivals": [
    "Kannamesai (October 17)",
    "Niinamesai (November 23)"
  ]
}
```

### Field Descriptions:

#### `kanji`
- **kanji**: Japanese characters (may include hiragana/katakana)
- **romanization**: Hepburn romanization of the name

#### `shrines`
Array of Shinto shrines dedicated to the deity:
- Major shrines (Jingu, Taisha)
- Local shrines (Jinja)
- Sacred sites
- Location information when available

#### `sacred_texts`
Array of classical texts that mention the deity:
- **Kojiki** (Record of Ancient Matters, 712 CE)
- **Nihon Shoki** (Chronicles of Japan, 720 CE)
- **Engishiki** (Procedures of the Engi Era)
- **Kogo Shui** (Gleanings from Ancient Stories)

#### `festivals`
Array of festivals (matsuri) celebrating the deity:
- Festival names in romanized Japanese
- Dates (Western or traditional calendar)
- Special ceremonies

---

## Aztec Deities (`aztec_specific`)

### Structure:
```json
"aztec_specific": {
  "nahuatl": {
    "primary_name": "Quetzalcoatl",
    "alternate_names": [
      "Ehecatl",
      "Ce Acatl"
    ],
    "meaning": "Feathered Serpent"
  },
  "calendar": {
    "day_sign": "9 Wind (9 Ehecatl)"
  },
  "festivals": [
    "Toxcatl - Month of drought",
    "Auto-sacrifice with maguey thorns"
  ],
  "sacrifices": [
    "Quetzal feathers, jade, butterflies, incense"
  ],
  "directions": {
    "cardinal": "West (as White Tezcatlipoca)"
  }
}
```

### Field Descriptions:

#### `nahuatl`
Names in the Nahuatl language:
- **primary_name**: Most common Nahuatl name
- **alternate_names**: Other names, epithets, or aspects
- **meaning**: English translation/meaning

#### `calendar`
Aztec calendar associations:
- **day_sign**: Sacred day in the 260-day tonalpohualli calendar
  - Format: [Number] [Day Name] (e.g., "9 Ehecatl" = 9 Wind)
  - 20 day signs × 13 numbers = 260 days

#### `festivals`
Array of festivals and ceremonial celebrations:
- Month names (18 months of 20 days each)
- Festival purposes
- Special rituals

#### `sacrifices`
Array of offerings and sacrifice practices:
- Types of offerings (flowers, incense, food)
- Auto-sacrifice (bloodletting)
- Human sacrifice (when historically documented)
- Animals or objects offered

#### `directions`
Cosmological associations:
- **cardinal**: One of the four cardinal directions
  - East (Red Tezcatlipoca)
  - North (Black Tezcatlipoca)
  - West (White Tezcatlipoca - Quetzalcoatl)
  - South (Blue Tezcatlipoca - Huitzilopochtli)

---

## Mayan Deities (`mayan_specific`)

### Structure:
```json
"mayan_specific": {
  "mayan_names": {
    "primary_name": "K'uk'ulkan",
    "alternate_names": [
      "Q'uq'umatz",
      "Kukulkan"
    ],
    "meaning": "Feathered Serpent"
  },
  "popol_vuh": [
    "Q'uq'umatz floated upon primordial waters with Tepeu",
    "Creator deity who spoke the world into existence"
  ],
  "calendar": {
    "celestial": "Venus as morning star"
  },
  "sacred_sites": [
    "Chichen Itza - Equinox serpent descent",
    "Sacred Cenote - Pilgrimage site"
  ]
}
```

### Field Descriptions:

#### `mayan_names`
Names in Mayan languages:
- **primary_name**: Most common Mayan name
- **alternate_names**: Regional variants (Yucatec, K'iche', etc.)
- **meaning**: English translation

#### `popol_vuh`
Array of references to the deity in the Popol Vuh:
- Creation myths
- Divine actions
- Relationships with other deities
- Role in cosmology

The Popol Vuh is the K'iche' Maya creation narrative, one of the most important Mesoamerican texts.

#### `calendar`
Calendar and astronomical associations:
- **celestial**: Association with celestial bodies
  - Venus (morning/evening star)
  - Moon phases
  - Solar phenomena (solstices, equinoxes)
  - Milky Way
- **cycle**: Specific calendar cycles (when relevant)

#### `sacred_sites`
Array of archaeological and pilgrimage sites:
- Major cities: Chichen Itza, Tikal, Palenque, Uxmal
- Cenotes (sacred wells)
- Cave systems
- Astronomical observatories
- Equinox/solstice phenomena

---

## Common Metadata Fields

All enhanced files include:
```json
"metadata": {
  "source_file": "mythos/chinese/deities/guanyin.html",
  "extraction_date": "2025-12-15T21:21:57.671683",
  "extraction_version": "2.6",
  "mythology": "chinese",
  "completeness_score": 30,
  "enhanced_date": "2025-12-25T14:48:37.210065",
  "enhanced_by": "Agent 8 - Cultural Enhancement",
  "enhancement_version": "1.0"
}
```

---

## Usage Examples

### Querying Chinese Deities by Character
```javascript
// Find deities with 观音 in corpus terms
db.deities.where('chinese_specific.corpus_terms', 'array-contains', '观音')

// Find Buddhist deities
db.deities.where('chinese_specific.associations.buddhist', '==', true)
```

### Querying Japanese Deities by Shrine
```javascript
// Find deities worshipped at Ise
db.deities.where('japanese_specific.shrines', 'array-contains-any',
  ['Ise Jingu', 'The Grand Shrine of Ise'])

// Find deities in the Kojiki
db.deities.where('japanese_specific.sacred_texts', 'array-contains', 'Kojiki (712 CE)')
```

### Querying Aztec Deities by Calendar
```javascript
// Find deities associated with Wind day sign
db.deities.where('aztec_specific.calendar.day_sign', '>=', '9 Wind')

// Find deities associated with the West
db.deities.where('aztec_specific.directions.cardinal', '==', 'West')
```

### Querying Mayan Deities by Site
```javascript
// Find deities associated with Chichen Itza
db.deities.where('mayan_specific.sacred_sites', 'array-contains-any',
  ['Chichen Itza'])

// Find deities mentioned in Popol Vuh
db.deities.where('mayan_specific.popol_vuh', '!=', null)
```

---

## Data Quality Notes

### Character Encoding
- All files use UTF-8 encoding
- Chinese, Japanese, and Nahuatl diacritics preserved
- No character corruption in enhanced files

### Source Attribution
- All data extracted from verified HTML sources
- No fabricated or speculative information added
- Empty arrays when data not available in source

### Arrays vs. Objects
- Use **arrays** for lists of items (temples, festivals, etc.)
- Use **objects** for structured data (nahuatl names, calendar info)
- Use **booleans** for flags (buddhist, daoist)

---

## Enhancement Script

Location: `H:\Github\EyesOfAzrael\scripts\enhance-asian-mesoamerican-deities.py`

The script:
1. Reads base JSON from `data/extracted/{mythology}/`
2. Parses HTML from `mythos/{mythology}/deities/`
3. Extracts culture-specific data using BeautifulSoup
4. Saves enhanced JSON to `firebase-assets-enhanced/deities/{mythology}/`

---

## Future Enhancements

Potential additions for next iteration:
1. **Pronunciation guides** - IPA or audio file links
2. **GPS coordinates** - For temples/shrines/sacred sites
3. **Direct text quotes** - Actual passages from Kojiki, Popol Vuh, etc.
4. **Calendar converters** - Map Aztec/Mayan dates to Gregorian
5. **Iconography data** - Symbolic attributes, mudras, regalia
6. **Related deities** - Programmatic linking of pantheon members

---

**Last Updated:** December 25, 2025
**Version:** 1.0
**Agent:** Agent 8
