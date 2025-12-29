# Corpus Query Format Documentation

## Overview

The Corpus Search System enables searching across mythological texts, primary sources, and scholarly references. This document describes the query format used to define and execute corpus searches.

## Table of Contents

1. [Query Structure](#query-structure)
2. [Query Types](#query-types)
3. [Render Modes](#render-modes)
4. [Adding Queries to Entities](#adding-queries-to-entities)
5. [Creating Custom Queries](#creating-custom-queries)
6. [Query Templates](#query-templates)
7. [Migration Script](#migration-script)
8. [Best Practices](#best-practices)

---

## Query Structure

A corpus query is defined as a JSON object with the following structure:

```json
{
  "id": "zeus-homer-epics",
  "label": "Zeus in Homer's Epics",
  "queryType": "firebase",
  "query": {
    "term": "Zeus",
    "alternateTerms": ["Jupiter", "father of gods"],
    "collections": ["texts", "myths"],
    "textFilters": ["iliad", "odyssey"],
    "mythologyFilter": "greek",
    "options": {
      "includeContext": true,
      "contextLines": 5,
      "maxResults": 100
    }
  },
  "renderMode": "panel",
  "entityRef": {
    "type": "deity",
    "id": "zeus",
    "name": "Zeus"
  },
  "autoLoad": false,
  "isStandard": true,
  "category": "primary-sources",
  "description": "References to Zeus in Homer's Iliad and Odyssey",
  "icon": "scroll",
  "priority": 1,
  "tags": ["homer", "epic", "primary-source", "greek"]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (kebab-case) |
| `label` | string | Human-readable display label |
| `queryType` | enum | Type of data source (`github`, `firebase`, `combined`) |
| `query` | object | The query parameters (see below) |

### Query Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `term` | string | Yes | Primary search term |
| `alternateTerms` | array | No | Alternate names/spellings to include |
| `collections` | array | No | Firebase collections to search |
| `repositories` | array | No | GitHub repositories to search |
| `textFilters` | array | No | Specific texts to filter by |
| `mythologyFilter` | string | No | Filter by mythology |
| `dateRange` | object | No | Filter by source date range |
| `options` | object | No | Additional query options |

### Query Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `caseSensitive` | boolean | false | Case-sensitive matching |
| `wholeWord` | boolean | false | Match whole words only |
| `includeContext` | boolean | true | Include surrounding text |
| `contextLines` | integer | 3 | Lines of context (1-10) |
| `maxResults` | integer | 50 | Maximum results (1-500) |
| `sortBy` | enum | relevance | Sort order |
| `highlightMatches` | boolean | true | Highlight matched terms |

### Optional Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `renderMode` | enum | How to display results |
| `entityRef` | object | Reference to associated entity |
| `autoLoad` | boolean | Auto-execute on page load |
| `isStandard` | boolean | Curated vs user-created |
| `category` | string | Query category |
| `description` | string | Query description |
| `icon` | string | Display icon/emoji |
| `priority` | integer | Display order (lower first) |
| `tags` | array | Categorization tags |

---

## Query Types

### `firebase`

Searches the Firebase/Firestore database containing parsed mythological texts and references.

```json
{
  "queryType": "firebase",
  "query": {
    "term": "Odin",
    "collections": ["texts", "myths"],
    "mythologyFilter": "norse"
  }
}
```

**Use for:**
- Searching parsed primary sources
- Mythology-specific searches
- Cross-referencing entities

### `github`

Searches GitHub repositories containing raw text files and scholarly sources.

```json
{
  "queryType": "github",
  "query": {
    "term": "Zeus",
    "repositories": ["sacred-texts/greek-myths", "homer/iliad"]
  }
}
```

**Use for:**
- Searching raw source texts
- Academic repositories
- Version-controlled texts

### `combined`

Searches both Firebase and GitHub sources simultaneously.

```json
{
  "queryType": "combined",
  "query": {
    "term": "Ra",
    "collections": ["texts"],
    "repositories": ["egyptian-texts/pyramid-texts"]
  }
}
```

**Use for:**
- Comprehensive searches
- Cross-platform references
- Maximum coverage

---

## Render Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `panel` | Collapsible side panel | Default, non-intrusive display |
| `inline` | Inline within content | Embedded references |
| `inline-grid` | Grid layout inline | Multiple result thumbnails |
| `full-page` | Full page view | Comprehensive searches |
| `modal` | Popup modal dialog | Quick reference lookups |
| `sidebar` | Fixed sidebar | Persistent reference panel |
| `embedded` | Embedded component | Integration with other UI |

### Examples

**Panel Mode (Default)**
```json
{
  "renderMode": "panel",
  "description": "Opens in a collapsible panel on the right side"
}
```

**Full Page Mode**
```json
{
  "renderMode": "full-page",
  "description": "Opens comprehensive search results in full page view"
}
```

---

## Adding Queries to Entities

Entities can have a `corpusQueries` array containing pre-configured searches:

```json
{
  "id": "zeus",
  "type": "deity",
  "name": "Zeus",
  "mythologies": ["greek"],
  "corpusQueries": [
    {
      "id": "zeus-homer-iliad",
      "label": "Zeus in the Iliad",
      "queryType": "firebase",
      "query": {
        "term": "Zeus",
        "textFilters": ["iliad"],
        "mythologyFilter": "greek"
      },
      "renderMode": "panel",
      "priority": 1
    },
    {
      "id": "zeus-all-sources",
      "label": "Zeus in All Greek Sources",
      "queryType": "firebase",
      "query": {
        "term": "Zeus",
        "collections": ["texts", "myths", "concepts"],
        "mythologyFilter": "greek"
      },
      "renderMode": "full-page",
      "priority": 10
    }
  ]
}
```

### Entity Reference

When adding queries to entities, include the `entityRef` field:

```json
{
  "entityRef": {
    "type": "deity",
    "id": "zeus",
    "name": "Zeus"
  }
}
```

---

## Creating Custom Queries

### Step 1: Define the Query Object

```javascript
const customQuery = {
  id: "my-custom-search",
  label: "My Custom Search",
  queryType: "firebase",
  query: {
    term: "search term",
    collections: ["texts"],
    options: {
      maxResults: 25,
      includeContext: true
    }
  },
  renderMode: "panel"
};
```

### Step 2: Validate Against Schema

The query should conform to the schema at:
```
data/schemas/corpus-query.schema.json
```

### Step 3: Add to Entity or Query Collection

**Option A: Add to entity file**
```json
{
  "corpusQueries": [/* your query */]
}
```

**Option B: Add to standard queries file**
```
data/corpus-queries/standard-deity-queries.json
```

### Step 4: Test the Query

Use the corpus search UI or API to verify results.

---

## Query Templates

The system provides templates for common query patterns:

### Deity Primary Sources Template

```json
{
  "queryType": "firebase",
  "query": {
    "collections": ["texts", "myths"],
    "options": {
      "includeContext": true,
      "contextLines": 5
    }
  },
  "renderMode": "panel",
  "isStandard": true,
  "category": "primary-sources"
}
```

### Comprehensive Search Template

```json
{
  "queryType": "firebase",
  "query": {
    "collections": ["texts", "myths", "concepts"],
    "options": {
      "includeContext": true,
      "maxResults": 200
    }
  },
  "renderMode": "full-page",
  "isStandard": true,
  "category": "primary-sources",
  "priority": 10
}
```

---

## Migration Script

Use the migration script to add corpus queries to existing entities:

```bash
# Preview changes (dry run)
node scripts/add-corpus-queries-to-entities.js --dry-run

# Run migration for all entities
node scripts/add-corpus-queries-to-entities.js

# Run for specific entity type
node scripts/add-corpus-queries-to-entities.js --type deity

# Run for specific mythology
node scripts/add-corpus-queries-to-entities.js --mythology greek

# Force overwrite existing queries
node scripts/add-corpus-queries-to-entities.js --force

# Verbose output
node scripts/add-corpus-queries-to-entities.js --verbose
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without modifying files |
| `--type <type>` | Only process entities of this type |
| `--mythology <mythology>` | Only process entities of this mythology |
| `--force` | Overwrite existing corpusQueries arrays |
| `--verbose` | Show detailed output |

---

## Best Practices

### 1. Use Alternate Terms

Include original language names and common epithets:

```json
{
  "query": {
    "term": "Zeus",
    "alternateTerms": ["Jupiter", "father of gods", "cloud-gatherer"]
  }
}
```

### 2. Set Appropriate Priorities

- **Priority 1-5**: Primary source searches (most relevant)
- **Priority 6-9**: Secondary/scholarly sources
- **Priority 10+**: Comprehensive/exhaustive searches

### 3. Use Text Filters for Precision

```json
{
  "query": {
    "textFilters": ["iliad", "odyssey", "theogony"]
  }
}
```

### 4. Include Context

Always enable context for readability:

```json
{
  "query": {
    "options": {
      "includeContext": true,
      "contextLines": 5
    }
  }
}
```

### 5. Tag Queries Appropriately

```json
{
  "tags": ["primary-source", "homer", "epic", "greek"]
}
```

### 6. Use Descriptive Labels

- Good: "Zeus in Homer's Iliad"
- Bad: "Search 1"

### 7. Set Reasonable Result Limits

- Panel mode: 50-100 results
- Full-page mode: 100-200 results

---

## Schema Reference

The full JSON Schema is available at:
```
data/schemas/corpus-query.schema.json
```

Standard deity queries are available at:
```
data/corpus-queries/standard-deity-queries.json
```

---

## Related Documentation

- [Entity Schema Guide](./ENTITY_SCHEMA_GUIDE.md)
- [Firebase Setup Guide](./FIREBASE_SETUP_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

---

*Last Updated: 2025-12-29*
*Version: 1.0.0*
