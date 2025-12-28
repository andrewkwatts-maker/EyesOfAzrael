# Schema Validation Quick Reference

## 🚀 Quick Start

### Browser Upload
1. Admin Dashboard → **Upload Entities**
2. Select JSON file
3. Review validation
4. Import

### Command Line
```bash
npm run validate:all:report
```

---

## ✅ Required Fields (All Entities)

```json
{
  "id": "lowercase-with-hyphens",
  "name": "Display Name",
  "type": "deity|hero|creature|ritual|cosmology|text|symbol|herb|place|concept|event",
  "mythology": "greek|norse|egyptian|hindu|buddhist|christian|islamic|babylonian|sumerian|persian|roman|celtic|chinese|japanese|aztec|mayan|yoruba|native_american|jewish|tarot|apocryphal|comparative"
}
```

---

## 📋 Entity Types

| Type | Description | Example |
|------|-------------|---------|
| `deity` | Gods and goddesses | Zeus, Odin, Ra |
| `hero` | Legendary heroes | Heracles, Gilgamesh |
| `creature` | Mythological beings | Dragon, Phoenix |
| `ritual` | Ceremonies | Offerings, Prayers |
| `cosmology` | Cosmic concepts | Creation, Afterlife |
| `text` | Sacred texts | Vedas, Torah |
| `symbol` | Sacred symbols | Ankh, Mjolnir |
| `herb` | Sacred plants | Lotus, Soma |
| `place` | Sacred locations | Mount Olympus |
| `concept` | Philosophical ideas | Karma, Dharma |
| `event` | Mythological events | Ragnarok, Flood |

---

## 🎯 NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run validate:entities` | Validate entity data |
| `npm run validate:templates` | Validate HTML templates |
| `npm run validate:all` | Validate everything |
| `npm run validate:all:report` | Full report (JSON) |

---

## 🔧 Validation Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **strict** | Reject invalid data | Production imports |
| **warn** | Accept with warnings | Drafts, development |
| **off** | Skip validation | Testing only |

---

## 🐛 Common Errors & Fixes

### Error: Missing Required Field
```json
// ❌ BAD
{
  "id": "apollo",
  "name": "Apollo"
}

// ✅ GOOD
{
  "id": "apollo",
  "name": "Apollo",
  "type": "deity",
  "mythology": "greek"
}
```

### Error: Invalid ID Format
```json
// ❌ BAD
"id": "Apollo Sun God"
"id": "APOLLO"

// ✅ GOOD
"id": "apollo-sun-god"
"id": "apollo"
```

### Error: Invalid Mythology
```json
// ❌ BAD
"mythology": "Greek"
"mythology": "Greece"

// ✅ GOOD
"mythology": "greek"
```

### Error: Description Too Short
```json
// ❌ BAD
"description": "Sun god"

// ✅ GOOD
"description": "Greek god of music, poetry, art, oracles, and the sun"
```

---

## 💡 Best Practices

### ✅ DO

- Use lowercase IDs with hyphens
- Include detailed descriptions (50+ chars)
- Add source references
- Link related entities
- Add meaningful tags
- Include both `description` and `shortDescription`
- Set metadata timestamps

### ❌ DON'T

- Use uppercase in IDs
- Submit entities without sources
- Skip validation in production
- Use generic tags like "deity" or "god"
- Leave metadata empty

---

## 📖 Deity Example

```json
{
  "id": "apollo",
  "name": "Apollo",
  "type": "deity",
  "mythology": "greek",
  "alternateNames": ["Phoebus", "Apollon"],
  "description": "Greek god of music, poetry, art, oracles, archery, plague, medicine, sun, light and knowledge. One of the most important and complex Olympian deities.",
  "shortDescription": "Greek god of music, poetry, art, and the sun",
  "pantheon": "Olympian",
  "rank": "major",
  "gender": "male",
  "domains": ["music", "poetry", "prophecy", "healing", "sun"],
  "family": {
    "parents": [
      { "id": "zeus", "name": "Zeus" },
      { "id": "leto", "name": "Leto" }
    ],
    "siblings": [
      { "id": "artemis", "name": "Artemis" }
    ]
  },
  "attributes": {
    "weapons": ["Silver bow and arrows"],
    "animals": ["Swan", "Raven", "Dolphin"],
    "symbols": ["Lyre", "Laurel wreath", "Sun"],
    "elements": ["fire", "air"]
  },
  "relatedEntities": [
    {
      "id": "artemis",
      "name": "Artemis",
      "relationship": "Twin sister"
    }
  ],
  "sources": [
    {
      "title": "Theogony",
      "author": "Hesiod"
    }
  ],
  "tags": ["olympian", "music", "prophecy", "healing", "sun"],
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "verified": true
  }
}
```

---

## 📖 Hero Example

```json
{
  "id": "heracles",
  "name": "Heracles",
  "type": "hero",
  "mythology": "greek",
  "alternateNames": ["Hercules"],
  "description": "Greatest of Greek heroes, known for his incredible strength and twelve labors. Son of Zeus and the mortal woman Alcmene.",
  "shortDescription": "Greek hero known for his strength and twelve labors",
  "gender": "male",
  "origin": "Thebes",
  "parentage": {
    "mortal": true,
    "divine": true,
    "parents": [
      { "id": "zeus", "name": "Zeus" },
      { "name": "Alcmene" }
    ]
  },
  "abilities": [
    "Superhuman strength",
    "Immortality (after death)"
  ],
  "quests": [
    {
      "title": "The Twelve Labors",
      "description": "Series of tasks performed as penance",
      "challenges": [
        "Slay the Nemean Lion",
        "Slay the Lernaean Hydra",
        "Capture the Golden Hind"
      ]
    }
  ],
  "relatedEntities": [
    {
      "id": "zeus",
      "name": "Zeus",
      "relationship": "Father"
    }
  ],
  "sources": [
    {
      "title": "Library",
      "author": "Apollodorus"
    }
  ],
  "tags": ["hero", "strength", "labors", "demigod"],
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "verified": true
  }
}
```

---

## 🌐 Browser API

### Initialize
```javascript
const validator = new SchemaValidator();
await validator.initialize();

const validatedCrud = new ValidatedCRUDManager(
  window.EyesOfAzrael.crudManager,
  validator
);
```

### Create with Validation
```javascript
await validatedCrud.create('greek_deities', entityData);
```

### Validate Entity
```javascript
const result = await validatedCrud.validateEntity('greek_deities', 'zeus');
console.log(result.isValid);
```

### Validate Collection
```javascript
const results = await validatedCrud.validateCollection('greek_deities');
console.log(`Valid: ${results.validCount}/${results.totalEntities}`);
```

---

## 📊 Validation Report Structure

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "totalEntities": 100,
  "validCount": 95,
  "invalidCount": 5,
  "results": [
    {
      "entity": "zeus",
      "name": "Zeus",
      "type": "deity",
      "isValid": true,
      "errorCount": 0,
      "warningCount": 1,
      "errors": [],
      "warnings": [
        {
          "field": "sources",
          "message": "Adding sources improves credibility"
        }
      ]
    }
  ]
}
```

---

## 🔍 Field Constraints

| Field | Min Length | Max Length | Pattern |
|-------|-----------|-----------|---------|
| `id` | 1 | 100 | `^[a-z0-9_-]+$` |
| `name` | 1 | 200 | Any |
| `description` | 10 | 10000 | Any |
| `shortDescription` | 10 | 500 | Any |
| `tags` | - | 50 | `^[a-z0-9_-]+$` |

---

## 📞 Support

- Full Guide: [SCHEMA_VALIDATION_GUIDE.md](SCHEMA_VALIDATION_GUIDE.md)
- Schema Files: `/schemas/*.schema.json`
- GitHub Issues: Report validation bugs

---

## 🎓 Learning Path

1. ✅ Read Quick Reference (you are here)
2. ✅ Review entity examples above
3. ✅ Try validation with sample data
4. ✅ Read full guide for advanced features
5. ✅ Contribute validated entities!
