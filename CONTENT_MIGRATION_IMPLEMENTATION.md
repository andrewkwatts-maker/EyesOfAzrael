# Content Migration Implementation Summary

## Overview

This implementation provides the **upload/storage side** of the content migration system, allowing you to extract mythology content from existing HTML files and upload them to Firebase Firestore. This creates a unified database of default (official) content that can later be combined with user-submitted content.

**Scope:** Database upload and storage only - does NOT include the reading/display side.

---

## Files Created

### 1. js/firebase-content-db.js

**Purpose:** Extended Firebase database class for managing all content types.

**Features:**
- Extends Firebase database operations for mythology content
- Supports all content types: deity, hero, creature, place, concept, ritual, magic, herb, symbol, text, archetype, cosmology, lineage, event
- Content validation for base fields and content-type-specific attributes
- ID generation: `default_{mythology}_{contentType}_{slug}` for default content
- Single content creation with `createContent(contentData, options)`
- Batch content creation with `batchCreateContent(contentArray, options)` (handles Firestore's 500-doc batch limit)
- Content querying with flexible filters (by mythology, content type, section, status, etc.)
- Proper timestamp conversion and caching

**Key Methods:**
- `createContent(contentData, options)` - Create single content item
- `batchCreateContent(contentArray, options)` - Batch upload for migration
- `queryContent(filters)` - Query content with pagination
- `validateBaseContent(contentData)` - Validate required fields
- `validateDeityAttributes()`, `validateHeroAttributes()`, `validateCreatureAttributes()` - Type-specific validation

**Usage Example:**
```javascript
await window.firebaseContentDB.init();

// Create single content
const result = await window.firebaseContentDB.createContent({
    title: 'Zeus',
    contentType: 'deity',
    mythology: 'greek',
    section: 'deities',
    summary: 'King of the Gods...',
    attributes: {
        domains: ['sky', 'thunder', 'justice'],
        symbols: ['thunderbolt', 'eagle']
    }
}, { isDefault: true });

// Batch upload
const results = await window.firebaseContentDB.batchCreateContent(
    contentArray,
    { isDefault: true }
);
```

---

### 2. js/content-migration-tool.js

**Purpose:** HTML content extraction and batch migration tool.

**Features:**

#### ContentExtractor Class
Parses HTML files and extracts structured content:

- **Path-based metadata extraction:**
  - Automatically infers mythology, section, and content type from file path
  - Example: `mythos/greek/deities/zeus.html` → `{ mythology: 'greek', section: 'deities', contentType: 'deity' }`

- **HTML content extraction:**
  - Title, subtitle, icon/emoji, summary
  - Deity attributes: titles, domains, symbols, sacred animals/plants, colors, family relationships
  - Hero attributes: epithet, parentage, notable deeds, weapons, companions
  - Creature attributes: species, appearance, abilities, weaknesses, habitat, origin
  - Rich content panels from section tags
  - Sources/citations
  - Related content links

- **Smart extraction logic:**
  - Handles multiple HTML structures (deity-header, hero-header, glass-card sections)
  - Cleans HTML content for storage
  - Extracts names from various text formats
  - Splits comma/semicolon-separated attribute values

#### ContentMigrationTool Class
Manages the complete migration workflow:

- **processFile(filePath, htmlContent)** - Extract content from single file
- **processFiles(fileDataArray)** - Batch process multiple files
- **validateExtracted()** - Validate extracted content against schema
- **generatePreviewReport()** - Generate preview JSON for review
- **uploadToFirestore(options)** - Batch upload to Firestore
- **generateMigrationReport(uploadResults)** - Create detailed migration report

**Usage Example:**
```javascript
// Process files
const result = await window.contentMigrationTool.processFiles([
    { path: 'mythos/greek/deities/zeus.html', html: '<html>...</html>' }
]);

// Validate
const validation = window.contentMigrationTool.validateExtracted();

// Upload
const uploadResults = await window.contentMigrationTool.uploadToFirestore();

// Generate report
const report = window.contentMigrationTool.generateMigrationReport(uploadResults);
```

---

### 3. firestore.indexes.json (Manual Update Required)

**Purpose:** Define Firestore composite indexes for efficient content queries.

**Status:** Manual update required (commented JSON cannot be programmatically edited)

**Indexes to Add:**

Add these indexes to the `"indexes"` array in `firestore.indexes.json` (after the taxonomies indexes):

```json
    // ===== CONTENT COLLECTION INDEXES =====

    // Basic status + timestamp
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Default vs User filtering
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Content type queries
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Mythology + Content Type (MOST COMMON QUERY)
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Default content filtering (for migration queries)
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "title", "order": "ASCENDING" }
      ]
    },

    // Author queries (for user content)
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Tags and related mythologies
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "relatedMythologies", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
```

**Deploy Indexes:**
```bash
firebase deploy --only firestore:indexes
```

---

### 4. scripts/upload-content.html

**Purpose:** Web-based UI for running content migration.

**Features:**

**Step 1: File Selection**
- Choose HTML files from mythos directory
- Supports multiple file selection
- Shows count of selected HTML files

**Step 2: Extract & Preview**
- Extract content from all selected files
- Display extraction statistics (total, successful, failed)
- Preview first 5 extracted items
- Validate extracted content against schema
- Show validation warnings/errors

**Step 3: Upload to Firestore**
- Batch upload to Firestore as default content
- Display upload statistics (successful, failed)
- Download extracted content as JSON for review
- Generate and download migration report

**Additional Features:**
- Real-time progress tracking
- Detailed log output with timestamps
- Color-coded log messages (success/error/warning)
- Confirmation dialog before upload
- Automatic migration report generation

**How to Use:**

1. Open `scripts/upload-content.html` in a browser
2. Make sure you're authenticated with Firebase (have proper credentials)
3. Click the file input and select HTML files from the `mythos/` directory
4. Click "Extract Content" to parse the files
5. Review the preview and click "Validate Extracted Content"
6. Fix any validation issues if needed
7. Click "Upload to Firestore" (with confirmation)
8. Download the migration report for your records

---

## Data Structure

### Content Schema (Firestore)

```typescript
{
  // Identity
  id: string;                           // "default_greek_deity_zeus"
  contentType: string;                  // "deity" | "hero" | "creature" | etc.

  // Core Info
  title: string;                        // "Zeus"
  subtitle: string;                     // "King of the Gods, God of Sky and Thunder"
  summary: string;                      // Brief description

  // Rich Content
  richContent: {
    panels: Array<{
      type: string;
      title: string;
      content: string;
      style: string;
    }>
  };

  // Taxonomy
  mythology: string;                    // "greek"
  mythologyName: string;                // "Greek Mythology"
  section: string;                      // "deities"
  sectionName: string;                  // "Deities"

  // Categorization
  tags: string[];
  relatedContent: string[];
  relatedMythologies: string[];

  // Media
  icon: string;                         // "⚡"
  imageUrl?: string;
  imageUrls?: string[];

  // Content-Type-Specific Attributes
  attributes: {
    // For deities:
    titles?: string[];
    domains?: string[];
    symbols?: string[];
    sacredAnimals?: string[];
    sacredPlants?: string[];
    colors?: string[];
    consorts?: string[];
    children?: string[];
    parents?: string[];
    siblings?: string[];

    // For heroes:
    epithet?: string;
    parentage?: string[];
    notableDeeds?: string[];
    weapons?: string[];
    companions?: string[];
    fateOrDeath?: string;

    // For creatures:
    species?: string;
    appearance?: string;
    abilities?: string[];
    weaknesses?: string[];
    habitat?: string;
    origin?: string;
    slainBy?: string;
  };

  // Additional Type-Specific Fields
  pantheon?: string;                    // "Olympian"
  role?: string;                        // "King of Gods"
  alignment?: string;

  // Source & Attribution
  isDefault: boolean;                   // TRUE for migrated content
  sources: string;
  authorId: null;                       // NULL for default content
  authorName: null;
  authorAvatar: null;

  // Metadata
  status: string;                       // "published"
  visibility: string;                   // "public"

  // Stats
  views: number;
  votes: number;
  commentsCount: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Migration Workflow

### Recommended Process

1. **Preparation:**
   - Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
   - Ensure Firebase authentication is configured
   - Back up existing Firestore data (if any)

2. **Test Migration (Small Batch):**
   - Select 5-10 HTML files from one mythology
   - Run extraction and validate
   - Upload to Firestore
   - Verify data in Firestore console
   - Check that indexes are working

3. **Full Migration:**
   - Select all HTML files from mythos directory
   - Extract content (may take a few minutes for hundreds of files)
   - Review validation warnings
   - Fix any critical issues
   - Upload to Firestore in batches
   - Download migration report

4. **Verification:**
   - Query Firestore to verify data integrity
   - Spot-check random samples
   - Verify relationships (parents, children, etc.)
   - Test query performance

5. **Post-Migration:**
   - Keep HTML files as backup
   - Store migration reports
   - Document any manual fixes needed
   - Update firestore.rules if needed

---

## File Extraction Support

### Supported Content Types

The extractor can handle these HTML file types:

- **Deities** (`mythos/*/deities/*.html`) → `contentType: 'deity'`
- **Heroes** (`mythos/*/heroes/*.html`) → `contentType: 'hero'`
- **Creatures** (`mythos/*/creatures/*.html`) → `contentType: 'creature'`
- **Places** (`mythos/*/places/*.html`) → `contentType: 'place'`
- **Cosmology** (`mythos/*/cosmology/*.html`) → `contentType: 'cosmology'`
- **Concepts** (`mythos/*/concepts/*.html`) → `contentType: 'concept'`
- **Rituals** (`mythos/*/rituals/*.html`) → `contentType: 'ritual'`
- **Magic** (`mythos/*/magic/*.html`) → `contentType: 'magic'`
- **Herbs** (`mythos/*/herbs/*.html`) → `contentType: 'herb'`
- **Symbols** (`mythos/*/symbols/*.html`) → `contentType: 'symbol'`
- **Texts** (`mythos/*/texts/*.html`) → `contentType: 'text'`
- **Archetypes** (`mythos/*/archetypes/*.html`) → `contentType: 'archetype'`
- **Lineage** (`mythos/*/lineage/*.html`) → `contentType: 'lineage'`
- **Teachings** (`mythos/*/teachings/*.html`) → `contentType: 'concept'`
- **Theology** (`mythos/*/theology/*.html`) → `contentType: 'concept'`

### Supported HTML Structures

The extractor recognizes these common HTML patterns:

**Headers:**
- `.deity-header`, `.hero-header`
- `.deity-icon`, `.hero-icon`, `.hero-icon-display`
- `.subtitle`

**Attributes:**
- `.attribute-grid` > `.attribute-card`
- `.attribute-label` + `.attribute-value`

**Content Sections:**
- `.glass-card`
- `section` elements with `h2`/`h3` headings
- `.labor-card` (for hero labors/deeds)

**Metadata:**
- `.citation` (for sources)
- `.see-also-link` (for related content)

**Skipped Files:**
- `index.html`
- `corpus-search.html`

---

## Security & Firestore Rules

The existing `firestore.rules` file should be updated to include rules for the `content` collection. Here's a recommended addition:

```javascript
// ===== CONTENT COLLECTION =====
// Path: /content/{contentId}

match /content/{contentId} {
  function isValidContent() {
    return request.resource.data.keys().hasAll(['title', 'summary', 'contentType', 'mythology', 'status'])
           && request.resource.data.title is string
           && request.resource.data.contentType in ['deity', 'hero', 'creature', 'place', 'concept', 'ritual', 'magic', 'herb', 'symbol', 'text', 'archetype', 'cosmology', 'lineage', 'event']
           && request.resource.data.status in ['draft', 'published', 'archived'];
  }

  // Public read for published content
  allow read: if resource.data.status == 'published'
              || (isAuthenticated() && resource.data.authorId == request.auth.uid)
              || isModerator();

  // Authenticated users can create user content
  allow create: if isAuthenticated()
                && !request.resource.data.isDefault  // Users cannot create default content
                && request.resource.data.authorId == request.auth.uid
                && isValidContent();

  // Owner or moderator can update
  allow update: if (isAuthenticated() && resource.data.authorId == request.auth.uid)
                || isModerator()
                && isValidContent();

  // Only moderators can delete
  allow delete: if isModerator();

  // Comments subcollection
  match /comments/{commentId} {
    allow read: if true;
    allow create: if isAuthenticated()
                  && request.resource.data.authorId == request.auth.uid;
    allow update: if isOwner(resource.data.authorId);
    allow delete: if isOwner(resource.data.authorId) || isModerator();
  }

  // Votes subcollection
  match /votes/{voteUserId} {
    allow read: if true;
    allow write: if isAuthenticated() && request.auth.uid == voteUserId;
  }
}
```

---

## Performance Considerations

### Batch Upload Limits

- Firestore has a 500-document batch limit
- The `batchCreateContent()` method automatically splits into multiple batches
- Large migrations (hundreds of files) may take several minutes

### Query Performance

- All common query patterns have composite indexes
- Default content is cached aggressively (changes rarely)
- Pagination is supported for large result sets

### Optimization Tips

1. **Test with small batches first** (5-10 files)
2. **Upload during off-peak hours** to minimize user impact
3. **Monitor Firestore usage** in Firebase console
4. **Use caching** for default content (24-hour TTL recommended)
5. **Implement pagination** for browse pages (50 items per page)

---

## Error Handling

### Common Extraction Errors

1. **"Could not extract title"**
   - HTML structure doesn't match expected patterns
   - Manual review required

2. **"Validation failed: Summary too short or missing"**
   - Summary extraction failed or summary < 10 characters
   - May need manual summary

3. **"Missing mythology/content type"**
   - File path doesn't match expected structure
   - Check file organization

### Common Upload Errors

1. **"Permission denied"**
   - Firestore rules blocking write
   - Authentication not configured

2. **"Index not found"**
   - Composite indexes not deployed
   - Run `firebase deploy --only firestore:indexes`

3. **"Batch write failed"**
   - Network error or timeout
   - Retry with smaller batches

---

## Next Steps

### What This Implementation Provides

- Firebase database schema for unified content
- HTML content extraction from existing files
- Batch migration to Firestore
- Validation and preview tools
- Migration UI and reporting

### What's NOT Implemented (Out of Scope)

- **Content rendering/display** - Reading content from Firestore and displaying it
- **Dynamic page generation** - Replacing static HTML with Firestore-powered pages
- **User submission forms** - Extended forms for users to submit new content
- **Browse/search integration** - Merging default and user content in browse pages
- **Content editing UI** - Admin tools to edit default content

### Recommended Next Phase

1. **Create content rendering components:**
   - `ContentRenderer` class to display content from Firestore
   - Template system for different content types
   - Dynamic page loading

2. **Integrate with existing pages:**
   - Add "Community Additions" sections to static pages
   - Combine default (HTML) and user (Firestore) content
   - Badge system to distinguish content sources

3. **Extend user submission forms:**
   - Add content-type-specific fields to submission form
   - Support deity, hero, creature attributes
   - Dynamic form fields based on selected type

4. **Build browse/search system:**
   - Unified browse pages showing both default and user content
   - Content type filters
   - Cross-mythology search

---

## Troubleshooting

### Firebase Connection Issues

```javascript
// Check Firebase initialization
console.log('Firebase app:', firebase.app().name);
console.log('Firestore initialized:', window.firebaseContentDB.initialized);

// Test database connection
await window.firebaseContentDB.queryContent({ limit: 1 });
```

### Validation Issues

```javascript
// Run validation separately
const validation = window.contentMigrationTool.validateExtracted();
console.log('Valid:', validation.valid.length);
console.log('Warnings:', validation.warnings);
```

### Index Issues

```bash
# View current indexes
firebase firestore:indexes

# Deploy indexes
firebase deploy --only firestore:indexes

# Check deployment status in Firebase Console
# Firestore > Indexes tab
```

---

## Summary

This implementation provides a complete **upload/storage pipeline** for migrating HTML mythology content to Firebase Firestore. It includes:

1. **Database layer** (firebase-content-db.js) - Content CRUD operations
2. **Migration tool** (content-migration-tool.js) - HTML extraction and batch processing
3. **Web UI** (upload-content.html) - User-friendly migration interface
4. **Database indexes** (firestore.indexes.json) - Optimized queries

The system is ready to migrate hundreds of HTML files into a unified Firestore database that supports:
- Default (official) content
- User-submitted content (future)
- Complex queries (by mythology, type, section, etc.)
- Scalable architecture for thousands of content items

**Status:** Upload/storage side complete. Reading/display side to be implemented next.
