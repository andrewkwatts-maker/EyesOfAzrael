# Corpus Search System

## Overview

The Corpus Search System enables searching across sacred texts and mythology entities within Eyes of Azrael. It provides a unified interface for querying:

- **GitHub-hosted sacred texts** (Bible translations, ancient manuscripts, mythological texts)
- **Firebase-stored mythology entities** (deities, creatures, items, places)
- **User-submitted custom queries** with community voting

The system supports multiple rendering modes, caching for performance, and metadata integration for enhanced search capabilities including alternate names and cross-cultural equivalents.

---

## Architecture

### Core Components

```
Corpus Search System
├── CorpusSearch (corpus-search-core.js)
│   ├── Configuration loading
│   ├── Repository management
│   ├── Text fetching with caching
│   └── Search execution with parsers
│
├── CorpusQueryService (Firebase integration)
│   ├── Query CRUD operations
│   ├── User query management
│   └── Voting system
│
├── Renderers (corpus-search-ui.js, corpus-results.js)
│   ├── Panel view
│   ├── Inline view
│   ├── Grid view
│   ├── Full-page explorer
│   ├── Modal overlay
│   ├── Sidebar panel
│   └── Embedded component
│
├── GitHubBrowser (corpus-github-browser.js)
│   ├── Repository browsing
│   ├── File filtering
│   └── Dynamic text selection
│
└── MetadataIntegration (corpus-metadata-integration.js)
    ├── Alternate name expansion
    ├── Cross-cultural mapping
    └── Result annotation
```

### Data Flow

```
User Query
    │
    ▼
┌─────────────────┐
│ CorpusSearch    │◄──── corpus-config.json
│ - init()        │
│ - loadRepos()   │
│ - search()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Parser          │     │ Cache           │
│ - JSON Bible    │     │ - localStorage  │
│ - XML/TEI       │     │ - sessionStorage│
│ - Plain Text    │     │ - memoryCache   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Results      │
              │ - text_name  │
              │ - context    │
              │ - metadata   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Renderer     │
              │ - panel      │
              │ - inline     │
              │ - grid       │
              └──────────────┘
```

---

## Query Types

### GitHub Queries

Search sacred texts hosted on GitHub repositories. Supports multiple text formats.

```javascript
const query = {
  type: 'github',
  term: 'creation',
  repositories: ['bible-kjv', 'book-of-dead'],
  options: {
    caseSensitive: false,
    maxResults: 100,
    contextWords: 10
  }
};
```

**Supported Repositories:**
- Bible translations (KJV, ESV, NIV, etc.)
- Book of the Dead (Egyptian)
- Eddas (Norse)
- Mahabharata, Upanishads (Hindu)
- Buddhist Sutras
- And more...

### Firebase Queries

Search mythology entities stored in Firestore.

```javascript
const query = {
  type: 'firebase',
  term: 'Zeus',
  collection: 'entities',
  filters: {
    mythology: 'greek',
    type: 'deity'
  }
};
```

**Searchable Collections:**
- `entities` - Deities, creatures, items, places
- `corpus_queries` - Saved query templates
- `user_corpus_queries` - User-submitted queries

### Combined Queries

Search both GitHub texts and Firebase entities simultaneously.

```javascript
const query = {
  type: 'combined',
  term: 'thunder god',
  github: {
    repositories: ['bible-kjv', 'eddas']
  },
  firebase: {
    collection: 'entities',
    filters: { type: 'deity' }
  }
};
```

---

## Render Modes

### Panel Mode (Default)

Expandable result panels with full context. Best for detailed exploration.

```html
<div class="corpus-panel">
  <div class="result-item">
    <div class="result-header">
      <span class="result-citation">Genesis 1:1</span>
      <span class="result-corpus">[KJV Bible]</span>
    </div>
    <div class="result-text">
      In the <mark>beginning</mark> God created the heaven and the earth.
    </div>
  </div>
</div>
```

**Use Case:** Primary search results, entity pages, full exploration

### Inline Mode

Compact inline text with hover preview. For embedded references.

```html
<span class="corpus-inline" data-term="creation">
  Found in 47 sacred texts <span class="preview-trigger">...</span>
</span>
```

**Use Case:** In-text references, tooltips, compact displays

### Inline-Grid Mode

Card grid layout for visual browsing.

```html
<div class="corpus-grid">
  <div class="grid-card">
    <h4>Genesis 1:1</h4>
    <p>In the beginning...</p>
  </div>
  <div class="grid-card">
    <h4>John 1:1</h4>
    <p>In the beginning was the Word...</p>
  </div>
</div>
```

**Use Case:** Browse mode, visual exploration, dashboards

### Full-Page Mode

Complete corpus explorer with search interface.

```html
<main class="corpus-explorer">
  <header class="explorer-header">
    <h1>Sacred Text Explorer</h1>
    <div class="search-interface">...</div>
  </header>
  <div class="results-container">...</div>
  <aside class="filters-sidebar">...</aside>
</main>
```

**Use Case:** Dedicated search pages (e.g., `/mythos/greek/corpus-search.html`)

### Modal Mode

Modal overlay for quick reference without navigation.

```html
<div class="corpus-modal">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button class="close-btn">&times;</button>
    <div class="results">...</div>
  </div>
</div>
```

**Use Case:** Quick lookup, reference without leaving page

### Sidebar Mode

Sidebar panel for persistent search while browsing.

```html
<aside class="corpus-sidebar" data-state="expanded">
  <div class="sidebar-header">
    <h3>Related Texts</h3>
    <button class="toggle-btn">...</button>
  </div>
  <div class="sidebar-content">...</div>
</aside>
```

**Use Case:** Entity pages, comparison view, research mode

### Embedded Mode

Minimal embedded component for integration with other views.

```html
<div class="corpus-embedded" data-query="zeus">
  <div class="embedded-header">Sacred Text References</div>
  <div class="embedded-results">...</div>
</div>
```

**Use Case:** Entity detail sections, info panels, widgets

---

## Adding Queries to Entities

Entities can include predefined corpus queries that appear on their detail pages.

### Entity JSON Schema

```json
{
  "id": "zeus",
  "name": "Zeus",
  "type": "deity",
  "mythology": "greek",
  "corpusQueries": [
    {
      "id": "zeus-bible-references",
      "name": "Biblical References to Zeus",
      "term": "Zeus",
      "type": "github",
      "repositories": ["bible-kjv", "apocrypha"],
      "renderMode": "panel",
      "description": "References to Zeus in Biblical texts"
    },
    {
      "id": "zeus-thunder-god",
      "name": "Thunder God Parallels",
      "term": "thunder god",
      "type": "combined",
      "expandAlternates": true,
      "renderMode": "inline-grid"
    }
  ]
}
```

### Query Options

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique query identifier |
| `name` | string | Display name for the query |
| `term` | string | Primary search term |
| `type` | string | Query type: `github`, `firebase`, `combined` |
| `repositories` | array | GitHub repos to search (for github/combined) |
| `renderMode` | string | How to display results |
| `expandAlternates` | boolean | Include alternate names in search |
| `filters` | object | Additional filters (mythology, type, etc.) |
| `maxResults` | number | Maximum results to return |

---

## User Queries

Users can create and save custom queries that are stored in Firebase.

### Creating a User Query

```javascript
// From the UI
const userQuery = {
  name: 'My Research Query',
  term: 'flood myth',
  type: 'combined',
  repositories: ['bible-kjv', 'gilgamesh', 'book-of-dead'],
  filters: {
    mythology: ['sumerian', 'babylonian', 'christian', 'hindu']
  },
  isPublic: true,
  tags: ['flood', 'deluge', 'catastrophe']
};

await CorpusQueryService.saveUserQuery(userId, userQuery);
```

### Voting on Queries

```javascript
// Upvote a helpful query
await CorpusQueryService.voteQuery(userId, queryId, 'up');

// Get vote counts
const votes = await CorpusQueryService.getVoteCount(queryId);
// { upvotes: 42, downvotes: 3, total: 39 }
```

### Query Moderation

User queries go through a moderation workflow:

1. **Pending** - Newly submitted, awaiting review
2. **Approved** - Visible to all users
3. **Featured** - Highlighted in discovery UI
4. **Rejected** - Hidden from public view

---

## API Reference

### CorpusSearch

Core search class for GitHub-hosted texts.

#### Constructor

```javascript
const search = new CorpusSearch(configPath, customParsers);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `configPath` | string | Path to corpus-config.json |
| `customParsers` | object | Optional custom parser implementations |

#### Methods

##### `init()`

Initialize the search system by loading configuration.

```javascript
await search.init();
```

##### `getRepositories()`

Get list of available repositories.

```javascript
const repos = search.getRepositories();
// Returns: [{ id: 'bible-kjv', name: 'KJV Bible', files: [...] }, ...]
```

##### `loadSelectedRepos(repoIds, callbacks)`

Load texts from selected repositories.

```javascript
await search.loadSelectedRepos(['bible-kjv', 'eddas'], {
  onProgress: ({ current, total, fileName, percentage }) => {
    console.log(`Loading ${fileName}: ${percentage}%`);
  },
  onComplete: ({ totalLoaded, loadedTexts }) => {
    console.log(`Loaded ${totalLoaded} texts`);
  },
  onError: ({ repo, file, error }) => {
    console.error(`Failed to load ${repo}/${file}: ${error}`);
  }
});
```

##### `search(term, options)`

Search loaded texts.

```javascript
const results = await search.search('creation', {
  caseSensitive: false,
  maxResults: 100,
  contextWords: 10,
  matchAll: false,
  terms: null,  // Optional: array of terms for OR search
  useMetadata: true  // Enable alternate name expansion
});
```

##### `clearCache()`

Clear all cached texts.

```javascript
search.clearCache();
```

##### `getStats()`

Get search statistics.

```javascript
const stats = search.getStats();
// Returns: { loadedTexts: 5, cacheSize: 2048, cacheHitRate: 85, ... }
```

---

### CorpusQueryService

Firebase integration for query storage.

#### Methods

##### `saveQuery(query)`

Save a query template.

```javascript
const queryId = await CorpusQueryService.saveQuery({
  name: 'Creation Myths',
  term: 'creation',
  type: 'combined'
});
```

##### `getQuery(queryId)`

Retrieve a query by ID.

```javascript
const query = await CorpusQueryService.getQuery(queryId);
```

##### `updateQuery(queryId, updates)`

Update an existing query.

```javascript
await CorpusQueryService.updateQuery(queryId, {
  name: 'Updated Name',
  maxResults: 50
});
```

##### `deleteQuery(queryId)`

Delete a query.

```javascript
await CorpusQueryService.deleteQuery(queryId);
```

##### `executeQuery(query)`

Execute a query and return results.

```javascript
const results = await CorpusQueryService.executeQuery(query);
```

##### `saveUserQuery(userId, query)`

Save a user-submitted query.

```javascript
const queryId = await CorpusQueryService.saveUserQuery(userId, query);
```

##### `getUserQueries(userId)`

Get all queries for a user.

```javascript
const queries = await CorpusQueryService.getUserQueries(userId);
```

##### `voteQuery(userId, queryId, voteType)`

Vote on a query ('up' or 'down').

```javascript
const result = await CorpusQueryService.voteQuery(userId, queryId, 'up');
// Returns: { action: 'added', voteType: 'up' }
```

##### `getVoteCount(queryId)`

Get vote counts for a query.

```javascript
const votes = await CorpusQueryService.getVoteCount(queryId);
// Returns: { upvotes: 10, downvotes: 2, total: 8 }
```

---

### Parsers

#### JSONBibleParser

Parses JSON-structured Bible texts.

```json
{
  "Genesis": {
    "1": {
      "1": "In the beginning God created the heaven and the earth.",
      "2": "And the earth was without form, and void..."
    }
  }
}
```

#### XMLParser

Parses XML/TEI formatted texts.

#### PlainTextParser

Parses line-based plain text files.

#### Custom Parsers

Implement custom parsers for specific formats:

```javascript
class MyCustomParser extends BaseParser {
  search(content, searchTerms, options) {
    // Parse content
    // Search for terms
    // Return results array
    return results;
  }
}

// Register custom parser
const search = new CorpusSearch('config.json', {
  'my-format': new MyCustomParser()
});
```

---

## Firestore Collections

### `corpus_queries`

Standard query templates.

```javascript
{
  id: "creation-myths-combined",
  name: "Creation Myths Across Cultures",
  term: "creation",
  type: "combined",
  repositories: ["bible-kjv", "eddas", "vedas"],
  mythology: null,  // All mythologies
  renderMode: "panel",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  useCount: 1542
}
```

### `user_corpus_queries/{userId}/queries`

User-submitted queries (subcollection per user).

```javascript
{
  id: "user_query_123",
  userId: "user_abc",
  name: "My Flood Research",
  term: "flood deluge",
  type: "combined",
  isPublic: true,
  status: "approved",
  votes: 15,
  createdAt: Timestamp,
  tags: ["flood", "water", "destruction"]
}
```

### `corpus_votes/{queryId}`

Vote tracking (prevents duplicate votes).

```javascript
{
  queryId: "user_query_123",
  votes: {
    "user_abc": "up",
    "user_def": "down",
    "user_ghi": "up"
  },
  upvotes: 2,
  downvotes: 1,
  total: 1
}
```

---

## Configuration

### corpus-config.json

Located in each mythology folder (e.g., `/mythos/greek/corpus-config.json`).

```json
{
  "repositories": [
    {
      "id": "bible-kjv",
      "name": "King James Version",
      "category": "Biblical",
      "owner": "sacred-texts",
      "repo": "kjv-bible",
      "branch": "main",
      "path": "texts",
      "enabled_by_default": true,
      "files": [
        {
          "name": "old-testament.json",
          "display": "Old Testament",
          "description": "Genesis through Malachi",
          "language": "en",
          "format": "json",
          "size_mb": 2.5
        }
      ]
    }
  ],
  "cache_duration_minutes": 60,
  "max_concurrent_fetches": 5,
  "api_settings": {
    "timeout_seconds": 30,
    "github_token": null
  }
}
```

---

## CSS Theming

### Theme Variables

```css
:root {
  /* Corpus link colors */
  --corpus-link-color: #8b7fff;
  --corpus-link-hover: #a89fff;
  --corpus-link-color-rgb: 139, 127, 255;

  /* Result styling */
  --corpus-result-bg: rgba(26, 31, 58, 0.4);
  --corpus-result-border: var(--color-border);
  --corpus-highlight-bg: rgba(139, 127, 255, 0.3);
}
```

### Customizing Per Mythology

```css
/* Greek mythology theme */
.mythology-greek {
  --corpus-link-color: #4fc3f7;
  --corpus-link-hover: #81d4fa;
}

/* Norse mythology theme */
.mythology-norse {
  --corpus-link-color: #90caf9;
  --corpus-link-hover: #bbdefb;
}
```

---

## Performance Optimization

### Caching Strategy

1. **localStorage** - Persistent cache (survives page reload)
2. **sessionStorage** - Session-only fallback
3. **Memory cache** - In-memory for fastest access

### Cache Duration

- Default: 60 minutes
- Configurable per repository
- Auto-cleanup of expired entries

### Rate Limiting

GitHub API rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5000 requests/hour

Configure token in corpus-config.json for higher limits.

### Lazy Loading

Results are loaded progressively:
- Initial batch: 20 results
- Load more on scroll
- Virtual scrolling for large result sets

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Alt+E` | Expand all sections |
| `Alt+C` | Collapse all sections |
| `Alt+T` | Toggle additional terms |
| `Enter` | Activate focused result |
| `Escape` | Close modal/sidebar |

### Screen Reader Support

- ARIA labels on all interactive elements
- Live regions for search results
- Focus management for modals

### High Contrast Support

- All text meets WCAG AA contrast ratios
- Highlight colors visible in high contrast mode
- Focus indicators clearly visible

---

## Troubleshooting

### Common Issues

**"No texts loaded" error**
- Ensure repositories are selected before searching
- Check network connectivity
- Verify corpus-config.json is accessible

**Slow search performance**
- Reduce maxResults
- Use more specific search terms
- Clear cache if corrupted

**Cache quota exceeded**
- Call `clearCache()` to free space
- Reduce cache_duration_minutes in config
- Use sessionStorage instead of localStorage

**GitHub rate limit exceeded**
- Wait for rate limit reset (shown in error)
- Add GitHub token to config
- Use cached results when available

### Debug Mode

Enable debug logging:

```javascript
window.CORPUS_DEBUG = true;
```

View cache statistics:

```javascript
console.log(corpusSearch.getStats());
console.log(corpusSearch.getCacheInfo());
```

---

## Related Documentation

- [Metadata Search Guide](./systems/METADATA_SEARCH_GUIDE.md)
- [Firebase Setup Guide](./systems/FIREBASE_SETUP_GUIDE.md)
- [API Reference](./systems/API_REFERENCE.md)
- [Developer Onboarding](./systems/DEVELOPER_ONBOARDING.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Dec 2025 | Full integration with 16-agent deployment |
| 1.5.0 | Nov 2025 | Added metadata integration |
| 1.0.0 | Oct 2025 | Initial corpus search implementation |
