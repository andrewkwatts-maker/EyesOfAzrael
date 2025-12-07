# Theory Taxonomy System V2

## Overview

The new taxonomy system provides a hierarchical structure for organizing user theories that maps directly to your website's page structure.

## Hierarchy Structure

```
Page → Section (optional) → Topic (optional) → User Topic → User Subtopic
```

### 1. **Page** (Required)
The mythology/tradition category - maps to top-level directories in `/mythos/`

Examples:
- `greek` → Greek Mythology
- `jewish` → Jewish Tradition
- `christian` → Christian Tradition
- `egyptian` → Egyptian Mythology
- `norse` → Norse Mythology

**Total:** 14 categories

### 2. **Section** (Optional)
The section within a page - maps to subdirectories

Examples for Jewish Tradition:
- `deities` → Deities
- `heroes` → Heroes
- `kabbalah` → Kabbalah
- `angels` → Angels
- `cosmology` → Cosmology

**Total:** 104 sections across all pages

### 3. **Topic** (Optional)
Specific page within a section - maps to individual HTML files

Examples for Jewish → Kabbalah:
- `sefirot` → Sefirot
- `worlds` → Four Worlds
- `72-names` → 72 Names of God
- `tree-of-life` → Tree of Life

**Total:** 390 topics across all pages/sections

### 4. **User Topic** (User-Defined)
Custom topic name created by the theory author

Examples:
- "Merkabah Physics"
- "Divine Feminine in Kabbalah"
- "Zeus as Sky Father Archetype"

### 5. **User Subtopic** (User-Defined, Optional)
Further refinement of user topic

Examples:
- "String Theory Connections"
- "Shekinah and Binah"
- "Indo-European Parallels"

## Data Structure

### Firestore Schema

```javascript
{
  // Required fields
  title: string,
  summary: string (max 500 chars),
  content: string,

  // Taxonomy (Page is REQUIRED, others optional)
  page: string,              // e.g., "greek", "jewish"
  section: string | null,    // e.g., "deities", "kabbalah"
  topic: string | null,      // e.g., "zeus", "72-names"
  userTopic: string | null,  // User-defined
  userSubtopic: string | null, // User-defined

  // Rich content
  richContent: {
    panels: [...],
    links: [...],
    corpus: [...]
  },
  images: [string], // URL array

  // Author info
  authorId: string,
  authorName: string,
  authorAvatar: string,

  // Metadata
  status: 'draft' | 'published',
  votes: number,
  views: number,
  commentCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Querying & Filtering

### Filter Combinations

Users can filter theories by any combination of:

1. **Page only**: All theories about Greek mythology
2. **Page + Section**: All theories about Greek deities
3. **Page + Section + Topic**: All theories about Zeus
4. **Page + User Topic**: All "Divine Geometry" theories in Jewish tradition
5. **Page + Section + Topic + User Topic**: Very specific filtering

### Firestore Indexes

Created composite indexes for efficient queries:
- `page + createdAt`
- `page + section + createdAt`
- `page + section + topic + createdAt`
- `page + section + topic + userTopic + createdAt`
- `page + userTopic + createdAt`

## User Interface

### Submission Form (submit.html)

```
1. Select Page (Required) ▼
   → Greek Mythology

2. Select Section (Optional) ▼
   → Deities

3. Select Topic (Optional) ▼
   → Zeus

4. Your Topic (Optional)
   [Custom text input]

5. Your Subtopic (Optional)
   [Custom text input]
```

### Browse Page (browse.html)

#### Global View
- Filter by: Page, Section, Topic, User Topic, User Subtopic, Author
- Sort by: Newest, Popular, Most Viewed
- Group by: User Topic within each Page/Section/Topic

#### Per-Page View
URL: `/theories/user-submissions/browse.html?page=greek&section=deities&topic=zeus`

- Shows only theories for that specific location
- Grouped/sorted by user topics
- Link appears on actual Zeus page

## Integration with Existing Pages

### Theory Links on Content Pages

Every page in `/mythos/` can have a "User Theories" link:

```html
<a href="/theories/user-submissions/browse.html?page=greek&section=deities&topic=zeus"
   class="user-theories-link">
    💭 User Theories (12)
</a>
```

### Corpus Search Integration

When searching for "Zeus", results can link to:
- Official Zeus page: `/mythos/greek/deities/zeus.html`
- User theories: `/theories/user-submissions/browse.html?page=greek&section=deities&topic=zeus`

### Auto-Generated Links

The `theory-taxonomy-v2.js` provides:
```javascript
theoryTaxonomy.generateTheoriesLinkHTML('greek', 'deities', 'zeus')
```

## Files

### Core Files
- `data/page-taxonomy.json` - Generated page structure (14 categories, 104 sections, 390 topics)
- `js/theory-taxonomy-v2.js` - Taxonomy management class
- `scripts/generate-page-taxonomy.js` - Taxonomy generator script

### Updated Files
- `firestore.rules` - Updated validation (page field required)
- `firestore.indexes.json` - New composite indexes for filtering
- `theories/user-submissions/submit.html` - Hierarchical selection UI
- `theories/user-submissions/browse.html` - Advanced filtering UI

## Benefits

1. **Direct Mapping**: Taxonomy matches actual site structure
2. **Flexible**: Users can be specific (Page+Section+Topic) or general (Page only)
3. **Discoverable**: Theories appear next to related official content
4. **Searchable**: Full filtering across all levels
5. **Scalable**: 802 pages mapped, easily extendable

## Next Steps

1. ✅ Generate page taxonomy from site structure
2. ✅ Create theory-taxonomy-v2.js
3. ✅ Update Firestore schema and deploy rules
4. 🔄 Update submit.html with cascading selects
5. 🔄 Update browse.html with advanced filtering
6. 🔄 Create theory widget for page integration
7. 🔄 Add links to existing pages
