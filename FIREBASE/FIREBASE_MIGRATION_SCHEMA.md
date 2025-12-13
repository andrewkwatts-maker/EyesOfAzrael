# Firebase Database Schema for Eyes of Azrael

## Overview
This document outlines the Firestore database schema for migrating the Eyes of Azrael website from static JSON files to a dynamic Firebase-powered database.

## Collections Structure

### 1. `mythologies` Collection
Each mythology tradition is stored as a document with standardized fields.

```javascript
{
  id: "jewish",                    // Document ID
  displayName: "Jewish/Kabbalah",  // Display name
  icon: "🕎",                       // Emoji icon
  description: "...",               // Brief description
  era: "2000 BCE - Present",        // Time period
  regions: ["Middle East", "Global"], // Geographic regions
  color: "#FFD700",                 // Theme color
  completed: true,                  // Completion status
  coreConcepts: [...],              // Array of core concepts
  keyTexts: [...],                  // Array of key texts
  corpusConfig: {...},              // Corpus search configuration
  metadata: {
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: "system",
    verified: true
  }
}
```

### 2. `deities` Collection
Individual deities across all mythologies.

```javascript
{
  id: "shiva",                      // Document ID
  name: "Shiva",                    // Deity name
  mythology: "hindu",               // Reference to mythology
  displayName: "Shiva (शिव)",      // Name with transliteration
  archetypes: ["destroyer", "transformer"], // Universal archetypes
  domains: ["destruction", "transformation", "dance"],
  symbols: ["trident", "crescent moon", "cobra"],
  description: "...",               // Full description
  epithets: [...],                  // Alternative names/titles
  relationships: {                  // Family/associate relationships
    consort: "parvati",
    children: ["ganesha", "kartikeya"]
  },
  primarySources: [...],            // Scripture references
  images: [...],                    // Image URLs
  metadata: {
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: "user_id",
    verified: false,
    submissionType: "user"          // "system" | "user"
  }
}
```

### 3. `archetypes` Collection
Universal archetypal patterns across mythologies.

```javascript
{
  id: "trickster",
  name: "Trickster",
  icon: "🎭",
  description: "...",
  characteristics: [...],
  occurrences: {
    norse: { deity: "loki", description: "..." },
    greek: { deity: "hermes", description: "..." },
    african: { deity: "anansi", description: "..." }
  },
  relatedArchetypes: ["culture-hero", "threshold-guardian"],
  metadata: {...}
}
```

### 4. `content_widgets` Collection
Reusable content widgets for displaying data in standardized format.

```javascript
{
  id: "deity_card",
  type: "card",                     // card | panel | grid | list
  template: "deity",                // Which data type this renders
  config: {
    fields: ["name", "mythology", "archetypes", "domains"],
    layout: "grid",
    style: "glass-card"
  },
  html_template: `...`,             // HTML template with placeholders
  css_styles: `...`,                // Associated CSS
  metadata: {...}
}
```

### 5. `user_submissions` Collection
User-contributed content pending review.

```javascript
{
  id: "submission_12345",
  type: "deity",                    // deity | hero | creature | theory
  mythology: "norse",
  data: {...},                      // The submitted content
  status: "pending",                // pending | approved | rejected
  submittedBy: "user_id",
  submittedAt: timestamp,
  reviewedBy: null,
  reviewedAt: null,
  reviewNotes: "",
  upvotes: 0,
  downvotes: 0,
  metadata: {...}
}
```

### 6. `theories` Collection
User theories and correlations (from existing theory system).

```javascript
{
  id: "theory_12345",
  title: "...",
  category: "comparative",          // From taxonomy system
  subcategory: "...",
  content: "...",
  author: "user_id",
  status: "published",              // draft | published | archived
  intellectualHonestyWarning: true,
  correlationRating: 3,             // 1-5 stars
  relatedMythologies: ["egyptian", "hindu"],
  relatedDeities: ["ra", "surya"],
  tags: [...],
  metadata: {...}
}
```

### 7. `herbs` Collection
Herbalism data across traditions.

```javascript
{
  id: "sage",
  commonName: "Sage",
  scientificName: "Salvia officinalis",
  traditions: {
    norse: { uses: [...], symbolism: "..." },
    greek: { uses: [...], symbolism: "..." }
  },
  universalProperties: [...],
  images: [...],
  metadata: {...}
}
```

### 8. `pages` Collection
Dynamic page content configuration.

```javascript
{
  id: "index",
  path: "/",
  title: "Eyes of Azrael",
  layout: "home",
  widgets: [
    { type: "hero", config: {...} },
    { type: "mythology_grid", dataSource: "mythologies", config: {...} },
    { type: "stats", config: {...} }
  ],
  seo: {
    description: "...",
    keywords: [...]
  },
  metadata: {...}
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public read, authenticated write for submissions
    match /user_submissions/{submissionId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.submittedBy
                             || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Public read, admin-only write for core content
    match /{collection}/{document=**} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "archetypes", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "user_submissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "mythologies",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "completed", "order": "ASCENDING" },
        { "fieldPath": "displayName", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Data Migration Strategy

### Phase 1: Extract from Static Files
1. Parse `mythos_data.js` → `mythologies` collection
2. Parse individual HTML deity pages → `deities` collection
3. Parse archetype data → `archetypes` collection
4. Parse herbalism data → `herbs` collection

### Phase 2: Transform
1. Standardize field names
2. Add metadata (timestamps, verification status)
3. Extract relationships (deity families, archetype mappings)
4. Generate search indices

### Phase 3: Load to Firebase
1. Batch upload to Firestore
2. Verify data integrity
3. Test queries and indices
4. Enable security rules

### Phase 4: Update Frontend
1. Replace static data loading with Firestore queries
2. Implement real-time listeners for live updates
3. Add loading states and error handling
4. Implement caching for performance

## Widget System

All content will be rendered using standardized widgets stored in `content_widgets` collection:

- **deity_card**: Display deity information
- **mythology_panel**: Show mythology overview
- **archetype_grid**: Grid of archetypes
- **relationship_tree**: Visual family trees
- **corpus_search**: Integrated scripture search
- **user_submission_form**: Form for user contributions
- **theory_editor**: Theory creation interface

Each widget is self-contained with:
- HTML template with {{placeholders}}
- CSS styles
- JavaScript for interactivity
- Configuration for data mapping

## Benefits

1. **Dynamic Content**: Update content without redeploying
2. **User Contributions**: Community-driven expansion
3. **Real-time Updates**: Changes propagate instantly
4. **Search & Filter**: Native Firestore querying
5. **Scalability**: Cloud infrastructure
6. **Consistency**: Standardized data structure
7. **Versioning**: Track content changes over time
