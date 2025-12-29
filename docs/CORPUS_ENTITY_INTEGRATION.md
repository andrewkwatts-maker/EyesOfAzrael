# Corpus Search Entity Integration

**Version**: 1.0.0
**Author**: Agent 6 - Entity Page Integration
**Date**: December 29, 2025

## Overview

This document explains how to integrate corpus search functionality into entity pages. The system allows entities to display relevant primary source references from ancient texts and related entities from the mythology database.

## Quick Start

### 1. Add corpusQueries to Entity JSON

Add a `corpusQueries` array to any entity JSON file:

```json
{
  "id": "zeus",
  "name": "Zeus",
  "type": "deity",
  "mythology": "greek",
  "corpusQueries": [
    {
      "id": "zeus-homer-iliad",
      "label": "Zeus in Homer's Iliad",
      "description": "Find all mentions of Zeus in the Iliad epic",
      "queryType": "github",
      "query": {
        "term": "Zeus",
        "repositories": ["sacred-texts/homer-iliad"],
        "options": {
          "caseSensitive": false,
          "contextWords": 15,
          "maxResults": 50
        }
      },
      "renderMode": "panel",
      "autoLoad": false,
      "order": 1,
      "isStandard": true
    }
  ]
}
```

### 2. Include Required Scripts

Ensure these scripts are loaded in your entity page:

```html
<script src="/js/services/corpus-query-service.js"></script>
<script src="/js/components/related-texts-section.js"></script>
<script src="/js/entity-page-loader.js"></script>
```

### 3. The corpus section renders automatically

When the entity page loads, the corpus queries section will be rendered automatically if:
- The entity has `corpusQueries` in its JSON data
- The entity type is one of: deity, hero, creature, text, item, place, concept

## Query Configuration

### Query Types

| Type | Description | Use Case |
|------|-------------|----------|
| `github` | Search external GitHub text repositories | Ancient texts (Iliad, Odyssey, Vedas, etc.) |
| `firebase` | Search internal Firestore entities | Related mythology entities |
| `combined` | Search both sources | Comprehensive results |

### Query Object Structure

```javascript
{
  "id": "unique-query-id",           // Required: Unique identifier
  "label": "Display Label",          // Required: Shown in UI
  "description": "Brief description", // Optional: Shown below label
  "queryType": "github",             // Required: github, firebase, or combined
  "query": {
    "term": "search term",           // Required: What to search for
    "repositories": ["repo/name"],   // For github queries
    "options": {
      "caseSensitive": false,        // Case-insensitive by default
      "contextWords": 15,            // Words of context around match
      "maxResults": 50,              // Max results to return
      "mythology": "greek",          // For firebase: filter by mythology
      "mode": "generic"              // For firebase: search mode
    }
  },
  "renderMode": "panel",             // How to display results
  "autoLoad": false,                 // Load automatically or on click
  "order": 1,                        // Display order (lower = first)
  "isStandard": true                 // Standard query (vs user-submitted)
}
```

### Render Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `panel` | Expandable panel with full results | Text references |
| `inline` | Compact inline display | Quick preview |
| `inline-grid` | Grid of entity cards | Related entities |
| `expandable-panel` | Same as panel | Alias for panel |

### Auto-Load vs Click-to-Load

- `autoLoad: true` - Results load immediately when page loads
- `autoLoad: false` - User must click to expand and load results

**Recommendation**: Use `autoLoad: true` sparingly (1-2 queries max) to maintain fast page load times.

## Examples by Entity Type

### Deity Example (Greek)

```json
"corpusQueries": [
  {
    "id": "athena-iliad",
    "label": "Athena in Homer's Iliad",
    "description": "Athena's role in the Trojan War epic",
    "queryType": "github",
    "query": {
      "term": "Athena",
      "repositories": ["sacred-texts/homer-iliad"],
      "options": { "contextWords": 15 }
    },
    "renderMode": "panel",
    "autoLoad": false,
    "order": 1,
    "isStandard": true
  },
  {
    "id": "athena-related",
    "label": "Related Greek Entities",
    "queryType": "firebase",
    "query": {
      "mode": "term",
      "term": "Athena",
      "options": { "mythology": "greek", "limit": 15 }
    },
    "renderMode": "inline-grid",
    "autoLoad": true,
    "order": 2,
    "isStandard": true
  }
]
```

### Deity Example (Norse)

```json
"corpusQueries": [
  {
    "id": "odin-edda",
    "label": "Odin in the Poetic Edda",
    "description": "The Allfather's appearances in the Elder Edda",
    "queryType": "github",
    "query": {
      "term": "Odin",
      "repositories": ["sacred-texts/poetic-edda"],
      "options": { "contextWords": 20 }
    },
    "renderMode": "panel",
    "autoLoad": false,
    "order": 1,
    "isStandard": true
  }
]
```

### Hero Example

```json
"corpusQueries": [
  {
    "id": "achilles-iliad",
    "label": "Achilles in the Iliad",
    "description": "The wrath of Achilles and his heroic deeds",
    "queryType": "github",
    "query": {
      "term": "Achilles",
      "repositories": ["sacred-texts/homer-iliad"],
      "options": { "contextWords": 20, "maxResults": 100 }
    },
    "renderMode": "panel",
    "autoLoad": false,
    "order": 1,
    "isStandard": true
  }
]
```

### Hindu Deity Example

```json
"corpusQueries": [
  {
    "id": "vishnu-rigveda",
    "label": "Vishnu in the Rig Veda",
    "queryType": "github",
    "query": {
      "term": "Vishnu",
      "repositories": ["sacred-texts/rigveda"],
      "options": { "contextWords": 25 }
    },
    "renderMode": "panel",
    "autoLoad": false,
    "order": 1,
    "isStandard": true
  },
  {
    "id": "vishnu-mahabharata",
    "label": "Vishnu in the Mahabharata",
    "queryType": "github",
    "query": {
      "term": "Vishnu",
      "repositories": ["sacred-texts/mahabharata"],
      "options": { "contextWords": 20 }
    },
    "renderMode": "panel",
    "autoLoad": false,
    "order": 2,
    "isStandard": true
  }
]
```

## Available Sacred Text Repositories

The following repositories are configured for GitHub corpus searches:

### Greek Texts
- `sacred-texts/homer-iliad` - Homer's Iliad
- `sacred-texts/homer-odyssey` - Homer's Odyssey
- `sacred-texts/hesiod-theogony` - Hesiod's Theogony
- `sacred-texts/homeric-hymns` - Homeric Hymns

### Norse Texts
- `sacred-texts/poetic-edda` - Poetic Edda (Elder Edda)
- `sacred-texts/prose-edda` - Snorri's Prose Edda (Younger Edda)

### Hindu Texts
- `sacred-texts/rigveda` - Rig Veda
- `sacred-texts/mahabharata` - Mahabharata
- `sacred-texts/ramayana` - Ramayana
- `sacred-texts/upanishads` - Principal Upanishads

### Buddhist Texts
- `sacred-texts/dhammapada` - Dhammapada
- `sacred-texts/pali-canon` - Pali Canon selections

### Egyptian Texts
- `sacred-texts/book-of-dead` - Egyptian Book of the Dead
- `sacred-texts/pyramid-texts` - Pyramid Texts

### Mesopotamian Texts
- `sacred-texts/epic-gilgamesh` - Epic of Gilgamesh
- `sacred-texts/enuma-elish` - Enuma Elish

## Firebase Search Modes

When using `queryType: "firebase"`, you can specify different search modes:

| Mode | Description |
|------|-------------|
| `generic` | Full-text search across all fields |
| `term` | Search corpus terms (epithets, domains, symbols) |
| `language` | Search language metadata (original names, transliterations) |
| `source` | Search source citations and references |
| `advanced` | Multi-criteria search with filters |

## Programmatic Usage

### Using RelatedTextsSection Component

```javascript
// Create container
const container = document.getElementById('corpus-section');

// Create entity object
const entity = {
    id: 'zeus',
    type: 'deity',
    name: 'Zeus',
    mythology: 'greek',
    corpusQueries: [/* queries array */]
};

// Initialize component
const textsSection = new RelatedTextsSection(container, entity, {
    showUserQueries: true,
    maxQueries: 10,
    autoLoadFirst: false,
    showCorpusExplorerLink: true
});

await textsSection.init();
```

### Using CorpusQueryService Directly

```javascript
// Get or create service instance
const queryService = window.corpusQueryService || new CorpusQueryService();
await queryService.init();

// Get queries for an entity
const queries = await queryService.getQueriesForEntity('deity', 'zeus');

// Execute a specific query
const results = await queryService.executeQuery(queries[0]);

console.log(results.combined); // Array of search results
```

## Styling and Theming

The corpus section uses CSS variables for theming:

```css
.corpus-search-section {
    --color-primary: var(--mythos-primary);
    --color-surface: var(--mythos-surface);
    --color-border: var(--mythos-border);
    --color-text-primary: var(--mythos-text-primary);
}
```

The section automatically inherits mythology-specific theming from the entity page.

## User Corpus Queries

Users can submit their own corpus queries which will appear in a separate "Community Queries" section. These queries:

- Are stored in Firebase under `user_corpus_queries`
- Can be voted on by other users
- Are sorted by vote count
- Must be approved before appearing publicly (optional moderation)

## Performance Considerations

1. **Limit auto-load queries**: Only auto-load 1-2 queries per entity
2. **Use appropriate maxResults**: Start with 25-50 for panels
3. **Cache results**: The service caches results for 5 minutes
4. **Lazy load on expand**: Non-autoLoad queries only fetch when clicked

## Troubleshooting

### Queries not appearing
- Ensure entity JSON has `corpusQueries` array
- Check browser console for errors
- Verify script includes are correct

### No results returned
- Check repository name is correct
- Verify search term is present in source texts
- Try increasing `maxResults`

### Slow loading
- Reduce number of `autoLoad: true` queries
- Lower `maxResults` value
- Check network connectivity

## Related Documentation

- [CORPUS_SEARCH_SYSTEM_MASTER_PLAN.md](./CORPUS_SEARCH_SYSTEM_MASTER_PLAN.md) - Full system architecture
- [corpus-search-core.js](../js/corpus-search-core.js) - Core GitHub search engine
- [corpus-search.js](../js/components/corpus-search.js) - Firebase search component

---

**Questions?** Open an issue or contact the development team.
