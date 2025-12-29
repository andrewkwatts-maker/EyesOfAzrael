# Corpus Search System - Master Plan
**Date**: December 29, 2025
**Version**: 3.0.0
**Status**: Implementation Plan

## Executive Summary

Implement a comprehensive corpus search system that allows entities to store standardized query templates in Firebase, render search results in multiple ways, and support user-submitted corpus queries.

## System Overview

### Two Corpus Search Modes

#### 1. GitHub Corpus Search (Sacred Texts)
- **Source**: External GitHub repositories (SEFARIA-PROJECT, EarlyModernBuddhism, etc.)
- **Use Case**: Search ancient texts (Bible, Torah, Vedas, Sutras, etc.)
- **Files**: `corpus-search-core.js`, corpus-config.json files

#### 2. Firebase Entity Search
- **Source**: Internal Firestore database
- **Use Case**: Search across all mythology entities
- **Files**: `js/components/corpus-search.js`

## Standardized Query Template Schema

### Firebase Entity Schema Addition

Each entity can store corpus search queries:

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
      "description": "Find all mentions of Zeus in the Iliad",
      "queryType": "github",
      "query": {
        "term": "Zeus",
        "repositories": ["homer-iliad"],
        "options": {
          "caseSensitive": false,
          "contextWords": 15,
          "maxResults": 50
        }
      },
      "renderMode": "panel",
      "autoLoad": false,
      "order": 1,
      "isStandard": true,
      "createdBy": null
    },
    {
      "id": "zeus-related-entities",
      "label": "Related Entities",
      "description": "Find all entities related to Zeus",
      "queryType": "firebase",
      "query": {
        "mode": "term",
        "term": "Zeus",
        "options": {
          "mythology": "greek",
          "limit": 25
        }
      },
      "renderMode": "inline-grid",
      "autoLoad": true,
      "order": 2,
      "isStandard": true,
      "createdBy": null
    }
  ],

  "userCorpusQueries": [
    {
      "id": "user-query-123",
      "userId": "user123",
      "userName": "@HistoryBuff",
      "label": "Zeus Birth Cave References",
      "description": "Texts mentioning Zeus's birth in the Dictaean Cave",
      "queryType": "github",
      "query": {
        "term": "Dictaean cave Zeus",
        "repositories": ["hesiod-theogony", "homer-hymns"],
        "options": {
          "matchAll": true,
          "contextWords": 20
        }
      },
      "renderMode": "expandable-panel",
      "votes": 42,
      "createdAt": 1735500000000,
      "isPublic": true
    }
  ]
}
```

### Query Types

| Type | Description | Engine |
|------|-------------|--------|
| `github` | Search external GitHub text repositories | CorpusSearch (core) |
| `firebase` | Search internal Firestore entities | CorpusSearch (component) |
| `combined` | Search both sources | Both engines |

### Render Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `panel` | Expandable panel on entity page | Default for entity detail |
| `inline` | Inline text with results count | Compact display |
| `inline-grid` | Grid of entity cards | Related entities |
| `full-page` | Dedicated search results page | Corpus explorer |
| `modal` | Modal overlay with results | Quick preview |
| `sidebar` | Sidebar panel | Split view |
| `embedded` | Embedded in content | In-context references |

## Component Architecture

### Core Components

#### 1. CorpusQueryStorage Service
```javascript
class CorpusQueryStorage {
  // CRUD operations for corpus queries
  async saveQuery(entityId, query)
  async getQueries(entityId)
  async updateQuery(entityId, queryId, updates)
  async deleteQuery(entityId, queryId)

  // User queries
  async saveUserQuery(entityId, userId, query)
  async getUserQueries(entityId)
  async voteOnQuery(queryId, userId, value)
}
```

#### 2. CorpusSearchExecutor Service
```javascript
class CorpusSearchExecutor {
  constructor(githubEngine, firebaseEngine)

  async executeQuery(query)
  async executeByType(queryType, queryConfig)
  async combineResults(githubResults, firebaseResults)
}
```

#### 3. CorpusResultRenderer Component
```javascript
class CorpusResultRenderer {
  constructor(containerElement, renderMode)

  render(results, options)
  renderPanel(results)
  renderInline(results)
  renderInlineGrid(results)
  renderFullPage(results)
  renderModal(results)
  renderSidebar(results)
  renderEmbedded(results)
}
```

#### 4. CorpusQueryEditor Component
```javascript
class CorpusQueryEditor {
  constructor(containerElement)

  // For user submissions
  createQueryForm(entityContext)
  validateQuery(query)
  previewResults(query)
  saveQuery(query)

  // For standard query editing (admin)
  editStandardQuery(queryId)
}
```

## UI/UX Design

### Entity Page Integration

```html
<section class="corpus-search-section">
  <div class="section-header">
    <h3>📚 Primary Source References</h3>
    <button class="add-corpus-query-btn">+ Add Query</button>
  </div>

  <!-- Standard Queries (from asset) -->
  <div class="corpus-queries standard-queries">
    <div class="corpus-query-panel" data-query-id="zeus-homer-iliad">
      <div class="query-header">
        <span class="query-icon">📜</span>
        <h4>Zeus in Homer's Iliad</h4>
        <button class="expand-btn">▼</button>
      </div>
      <div class="query-content collapsed">
        <!-- Rendered results when expanded -->
      </div>
    </div>
  </div>

  <!-- User Queries (Community) -->
  <div class="corpus-queries user-queries" data-visible="opt-in">
    <div class="section-subheader">
      <span class="community-label">Community Queries</span>
      <span class="query-count">+12 queries</span>
    </div>

    <div class="corpus-query-panel user-query" data-query-id="user-query-123">
      <div class="query-header">
        <span class="query-icon">🔍</span>
        <h4>Zeus Birth Cave References</h4>
        <span class="author">by @HistoryBuff</span>
        <div class="vote-buttons">
          <button class="upvote">👍 42</button>
          <button class="downvote">👎 3</button>
        </div>
      </div>
      <div class="query-content collapsed">
        <!-- Rendered results when expanded -->
      </div>
    </div>
  </div>
</section>
```

### Corpus Query Editor Modal

```html
<div class="modal corpus-query-editor-modal">
  <div class="modal-content">
    <h2>Create Corpus Search Query</h2>

    <form class="query-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h3>Query Details</h3>
        <div class="form-group">
          <label>Query Label *</label>
          <input type="text" name="label" required
                 placeholder="e.g., Zeus in the Iliad" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description"
                    placeholder="What does this query find?"></textarea>
        </div>
      </div>

      <!-- Query Type -->
      <div class="form-section">
        <h3>Search Source</h3>
        <div class="form-group">
          <label>Query Type *</label>
          <select name="queryType">
            <option value="github">Sacred Texts (GitHub)</option>
            <option value="firebase">Mythology Database</option>
            <option value="combined">Both Sources</option>
          </select>
        </div>
      </div>

      <!-- GitHub Query Options (conditional) -->
      <div class="form-section github-options">
        <h3>Text Search Options</h3>
        <div class="form-group">
          <label>Search Term *</label>
          <input type="text" name="term"
                 placeholder="e.g., Zeus thunderbolt" />
        </div>
        <div class="form-group">
          <label>Text Sources</label>
          <select name="repositories" multiple>
            <option value="homer-iliad">Homer's Iliad</option>
            <option value="homer-odyssey">Homer's Odyssey</option>
            <option value="hesiod-theogony">Hesiod's Theogony</option>
            <!-- More repos from corpus-config.json -->
          </select>
        </div>
        <div class="form-group">
          <label>Match Type</label>
          <select name="matchType">
            <option value="any">Match Any Word</option>
            <option value="all">Match All Words</option>
            <option value="phrase">Exact Phrase</option>
          </select>
        </div>
        <div class="form-group">
          <label>Context Words: <span id="contextValue">15</span></label>
          <input type="range" name="contextWords" min="5" max="50" value="15" />
        </div>
      </div>

      <!-- Firebase Query Options (conditional) -->
      <div class="form-section firebase-options">
        <h3>Entity Search Options</h3>
        <div class="form-group">
          <label>Search Mode</label>
          <select name="searchMode">
            <option value="generic">Full Text Search</option>
            <option value="language">Language/Script Search</option>
            <option value="source">Source/Citation Search</option>
            <option value="term">Corpus Term Search</option>
          </select>
        </div>
        <div class="form-group">
          <label>Filter by Mythology</label>
          <select name="mythology">
            <option value="">All Mythologies</option>
            <option value="greek">Greek</option>
            <option value="norse">Norse</option>
            <!-- ... -->
          </select>
        </div>
      </div>

      <!-- Render Options -->
      <div class="form-section">
        <h3>Display Options</h3>
        <div class="form-group">
          <label>Render Mode</label>
          <select name="renderMode">
            <option value="panel">Expandable Panel</option>
            <option value="inline">Inline Summary</option>
            <option value="inline-grid">Entity Grid</option>
            <option value="modal">Modal Preview</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="autoLoad" />
            Load results automatically
          </label>
        </div>
      </div>

      <!-- Preview -->
      <div class="form-section">
        <h3>Preview Results</h3>
        <button type="button" class="preview-btn">Test Query</button>
        <div class="preview-results"></div>
      </div>

      <!-- Visibility -->
      <div class="form-section">
        <div class="form-group">
          <label>
            <input type="checkbox" name="isPublic" checked />
            Make this query public (visible to other users)
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-save">Save Query</button>
      </div>
    </form>
  </div>
</div>
```

### Full-Page Corpus Search View

```html
<div class="corpus-explorer-page">
  <header class="explorer-header">
    <h1>📚 Corpus Search</h1>
    <p>Search across sacred texts and mythology database</p>
  </header>

  <div class="search-controls">
    <div class="search-bar">
      <input type="text" id="corpus-search-input"
             placeholder="Search sacred texts..." />
      <button id="corpus-search-btn">Search</button>
    </div>

    <div class="search-filters">
      <select id="source-filter">
        <option value="all">All Sources</option>
        <option value="github">Sacred Texts Only</option>
        <option value="firebase">Database Only</option>
      </select>

      <select id="mythology-filter">
        <option value="">All Mythologies</option>
        <option value="greek">Greek</option>
        <option value="norse">Norse</option>
        <!-- ... -->
      </select>

      <select id="text-filter">
        <option value="">All Texts</option>
        <optgroup label="Greek">
          <option value="homer-iliad">Homer's Iliad</option>
          <option value="homer-odyssey">Homer's Odyssey</option>
        </optgroup>
        <!-- ... -->
      </select>
    </div>
  </div>

  <div class="search-results-container">
    <div class="results-header">
      <span class="result-count">0 results</span>
      <select id="sort-by">
        <option value="relevance">Most Relevant</option>
        <option value="text">By Text</option>
        <option value="verse">By Verse</option>
      </select>
    </div>

    <div class="results-list">
      <!-- Results rendered here -->
    </div>

    <div class="results-pagination">
      <!-- Pagination controls -->
    </div>
  </div>
</div>
```

## Firebase Schema

### Collections

```
firestore/
├── corpus_queries/                    # Stored queries
│   └── {entityId}/
│       └── queries/
│           └── {queryId}
│               ├── id: string
│               ├── label: string
│               ├── description: string
│               ├── queryType: "github" | "firebase" | "combined"
│               ├── query: object
│               ├── renderMode: string
│               ├── autoLoad: boolean
│               ├── order: number
│               ├── isStandard: boolean
│               ├── createdBy: string | null
│               ├── createdAt: timestamp
│               └── votes: number
│
├── user_corpus_queries/               # User-submitted queries
│   └── {userId}/
│       └── {entityId}/
│           └── {queryId}
│               ├── ...query fields
│               ├── isPublic: boolean
│               └── votes: number
│
├── corpus_query_votes/                # Vote tracking
│   └── {queryId}/
│       └── {userId}
│           ├── value: 1 | -1
│           └── timestamp: number
│
└── corpus_search_history/             # Search analytics
    └── {userId}/
        └── {searchId}
            ├── query: string
            ├── queryType: string
            ├── resultCount: number
            ├── timestamp: number
            └── clicked: string[] (result IDs)
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Standard corpus queries (admin only)
    match /corpus_queries/{entityId}/queries/{queryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User corpus queries
    match /user_corpus_queries/{userId}/{entityId}/{queryId} {
      allow read: if resource.data.isPublic == true || isOwner(userId);
      allow create: if isSignedIn() && isOwner(userId);
      allow update, delete: if isOwner(userId);
    }

    // Query votes
    match /corpus_query_votes/{queryId}/{voterId} {
      allow read: if true;
      allow write: if isSignedIn() && isOwner(voterId);
    }

    // Search history (private)
    match /corpus_search_history/{userId}/{searchId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Agents 1-2)
1. Create CorpusQueryStorage service
2. Define standardized query schema
3. Create Firebase collections and rules
4. Build query execution coordinator

### Phase 2: Renderer Components (Agents 3-5)
3. Build panel renderer (expandable)
4. Build inline renderer (compact)
5. Build full-page corpus explorer

### Phase 3: Entity Integration (Agent 6)
6. Add corpus search section to entity pages
7. Integrate with existing entity renderer
8. Handle auto-loading and lazy loading

### Phase 4: User Submissions (Agent 7)
7. Build query editor modal
8. Add to user submission system
9. Integrate voting and sorting

### Phase 5: Testing & Polish (Agent 8)
8. Integration testing
9. Performance optimization
10. Documentation

## Agent Deployment Plan

### Agent 1: Core Corpus Query Service
- Create `js/services/corpus-query-storage.js`
- Create `js/services/corpus-search-executor.js`
- Update Firestore rules
- Create Firebase indexes

### Agent 2: Standardized Query Schema
- Define TypeScript/JSDoc types
- Create query validation utilities
- Build query migration script for existing data
- Create sample queries for major entities

### Agent 3: Panel Renderer Component
- Create `js/components/corpus-result-panel.js`
- Create `css/corpus-result-panel.css`
- Support expandable/collapsible behavior
- Show results with highlighting

### Agent 4: Inline & Grid Renderers
- Create `js/components/corpus-result-inline.js`
- Create `js/components/corpus-result-grid.js`
- Compact display modes
- Entity card grid for related items

### Agent 5: Full-Page Corpus Explorer
- Create `corpus-explorer.html`
- Create `js/views/corpus-explorer-view.js`
- Create `css/corpus-explorer.css`
- Advanced search UI with filters

### Agent 6: Entity Page Integration
- Modify `js/entity-renderer-firebase.js`
- Add corpus queries section
- Handle query execution on expand
- Support user/standard query toggle

### Agent 7: User Query Submission
- Create `js/components/corpus-query-editor.js`
- Create `components/corpus-query-editor-modal.html`
- Integrate with user asset system
- Add voting from voting system

### Agent 8: Final Testing & Documentation
- Integration tests
- Cross-browser testing
- Performance audit
- User documentation
- API documentation

## Success Metrics

| Metric | Target |
|--------|--------|
| Query storage works | 100% |
| All render modes functional | 7/7 modes |
| User queries saveable | Yes |
| Voting integration | Yes |
| Auto-load performance | <500ms |
| Full-page search | <2s results |

## Timeline

- **Agents 1-2**: 3-4 hours each
- **Agents 3-5**: 2-3 hours each
- **Agents 6-7**: 4-5 hours each
- **Agent 8**: 3-4 hours

**Total**: 25-35 hours (parallel execution: 6-8 hours)

---

**Status**: Ready for Agent Deployment
