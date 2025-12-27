# Complete Firebase Database Schema for Eyes of Azrael

## Overview
This schema supports the entire website migration from static HTML to Firebase, enabling:
- User-submitted theories and assets
- Official mythology content migration
- Community editing and contributions
- Cross-linking and relationships
- Icons and SVG graphics
- Complete metadata system

---

## 🗃️ Firestore Collections

### 1. `users` Collection
Stores user profile and authentication data.

```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,            // User email
  displayName: string,      // Display name
  photoURL: string,         // Profile picture URL
  createdAt: timestamp,     // Account creation
  lastLogin: timestamp,     // Last login time
  role: string,            // 'user' | 'moderator' | 'admin'
  reputation: number,       // Community reputation score
  contributions: {
    theoriesCount: number,
    assetsCount: number,
    editsCount: number,
    votesGiven: number
  },
  preferences: {
    theme: string,          // 'dark' | 'light' | 'auto'
    notifications: boolean
  }
}
```

**Indexes:**
- `email` (unique)
- `role`
- `reputation` (descending)

---

### 2. `theories` Collection
User-submitted theories and analyses.

```javascript
{
  id: string,                      // Auto-generated doc ID

  // Basic Info
  title: string,                   // Theory title
  summary: string,                 // Brief summary
  content: string,                 // Full text content (legacy)

  // Rich Content Panels
  richContent: {
    panels: [                      // Array of panels
      {
        type: string,              // 'panel' | 'grid' | 'svg'
        title: string,
        titleIcon: string,         // Emoji or icon class
        content: string,
        order: number,

        // For SVG panels
        svgCode: string,           // SVG markup
        svgPrompt: string,         // Original prompt (if AI-generated)
        svgGeneratedBy: string,    // 'user' | 'gemini-ai'

        // For grid panels
        gridWidth: number,         // Number of columns
        children: [                // Grid items
          {
            type: string,          // 'panel' | 'link' | 'search' | 'image'
            title: string,
            titleIcon: string,
            content: string,
            url: string,           // For links and images
            searchType: string,    // 'corpus' | 'mythology' | 'general'
            searchQuery: string,
            order: number
          }
        ]
      }
    ]
  },

  // Taxonomy & Classification
  contributionType: string,        // 'theory' | 'deity' | 'hero' | 'creature' | etc.
  page: string,                    // Primary category (greek, norse, jewish, etc.)
  section: string,                 // Section within page (optional)
  topic: string,                   // Specific topic (optional)
  userTopic: string,               // Custom topic name
  userSubtopic: string,            // Custom subtopic

  // Metadata
  relatedMythologies: [string],    // Array of mythology IDs
  tags: [string],                  // Custom tags
  themes: [string],                // Universal themes
  sources: string,                 // References and citations

  // Asset-Specific Metadata (when contributionType != 'theory')
  assetMetadata: {
    // Deity fields
    pantheon: string,
    domain: string,
    symbols: string,
    epithets: string,

    // Hero fields
    heroRole: string,
    era: string,
    deeds: string,

    // Creature fields
    creatureType: string,
    attributes: string,
    behavior: string,

    // Place fields
    placeType: string,
    location: string,
    significance: string,

    // Item fields
    itemType: string,
    powers: string,
    origin: string,

    // Herb fields
    botanical: string,
    uses: string,
    associations: string,

    // Text fields
    textType: string,
    author: string,
    date: string,

    // Concept fields
    conceptCategory: string,
    keyPrinciples: string,

    // Mythology fields
    culture: string,
    region: string,
    period: string,
    keyTexts: string
  },

  // Authorship & Status
  authorId: string,                // User UID
  authorName: string,              // Display name
  status: string,                  // 'draft' | 'published' | 'archived' | 'approved'
  visibility: string,              // 'public' | 'unlisted' | 'private'
  isOfficial: boolean,             // Migrated from official content

  // Community Engagement
  votes: {
    upvotes: number,
    downvotes: number,
    score: number                  // upvotes - downvotes
  },
  views: number,                   // View count
  bookmarks: number,               // Bookmark count

  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp
}
```

**Indexes:**
1. `authorId` + `createdAt` (desc)
2. `page` + `section` + `topic` + `createdAt` (desc)
3. `contributionType` + `status` + `createdAt` (desc)
4. `status` + `votes.score` (desc)
5. `page` + `status` + `votes.score` (desc)
6. `relatedMythologies` (array) + `createdAt` (desc)
7. `themes` (array) + `votes.score` (desc)
8. `isOfficial` + `page` + `section`

---

### 3. `assets` Collection
Unified collection for all mythology assets (deities, heroes, places, etc.).
This will eventually hold all migrated official content + user submissions.

```javascript
{
  id: string,                      // Auto-generated or slug

  // Asset Type & Classification
  assetType: string,               // 'deity' | 'hero' | 'creature' | 'place' | 'item' | 'herb' | 'text' | 'concept' | 'event'
  mythology: string,               // Primary mythology (greek, norse, jewish, etc.)
  culture: string,                 // Cultural origin

  // Basic Information
  name: string,                    // Primary name
  alternateNames: [string],        // Alternate names, epithets
  nameIcon: string,                // Icon for this asset
  pronunciation: string,           // Phonetic pronunciation

  // Rich Description
  summary: string,                 // Brief description
  description: string,             // Full description (legacy)
  richContent: {                   // Panel-based content (same as theories)
    panels: [/* same structure as theories */]
  },

  // SVG Icon/Symbol
  symbolSVG: string,               // Custom SVG symbol for this asset
  symbolPrompt: string,            // AI prompt if generated

  // Type-Specific Metadata
  deityData: {
    pantheon: string,              // Greek Olympians, Norse Aesir, etc.
    domain: [string],              // Domains of influence
    symbols: [string],             // Sacred symbols
    epithets: [string],            // Titles and epithets
    parents: [string],             // Asset IDs of parents
    children: [string],            // Asset IDs of offspring
    consorts: [string],            // Asset IDs of spouses/consorts
    gender: string,                // 'male' | 'female' | 'non-binary' | 'varies'
    alignment: string              // 'chaotic' | 'neutral' | 'lawful'
  },

  heroData: {
    role: string,                  // warrior, prophet, king, etc.
    era: string,                   // Time period
    birthplace: string,            // Asset ID of place
    deathplace: string,            // Asset ID of place
    notableDeeds: [string],        // Major accomplishments
    weapons: [string],             // Asset IDs of items
    companions: [string],          // Asset IDs of other heroes
    mentor: string,                // Asset ID of mentor
    archetype: string              // Hero archetype
  },

  creatureData: {
    creatureType: string,          // dragon, angel, demon, etc.
    physicalAttributes: [string],
    behavior: string,
    habitat: string,               // Asset ID of place
    diet: string,
    lifespan: string,
    abilities: [string],
    weaknesses: [string]
  },

  placeData: {
    placeType: string,             // temple, realm, mountain, etc.
    location: string,              // Geographic or mythical location
    coordinates: {                 // If real-world location
      lat: number,
      lng: number
    },
    significance: string,
    inhabitants: [string],         // Asset IDs of beings
    events: [string],              // Asset IDs of events
    parentRealm: string            // Asset ID of containing realm
  },

  itemData: {
    itemType: string,              // weapon, tool, jewelry, etc.
    material: string,
    powers: [string],
    origin: string,
    creator: string,               // Asset ID of deity/hero
    currentOwner: string,          // Asset ID
    curses: [string],
    restrictions: string
  },

  herbData: {
    botanicalName: string,
    appearance: string,
    habitat: string,
    seasonality: string,
    sacredUses: [string],
    medicinalUses: [string],
    ritualUses: [string],
    associatedDeities: [string],   // Asset IDs
    preparations: [string]
  },

  textData: {
    textType: string,              // scripture, epic, hymn, etc.
    author: string,                // Asset ID or name
    dateComposed: string,
    language: string,
    verses: number,
    chapters: number,
    content: string,               // Full text or excerpt
    translations: [
      {
        language: string,
        translator: string,
        year: string,
        excerpt: string
      }
    ],
    commentary: string
  },

  conceptData: {
    conceptCategory: string,       // cosmology, theology, etc.
    keyPrinciples: [string],
    relatedConcepts: [string],     // Asset IDs
    opposingConcepts: [string],    // Asset IDs
    practices: [string],
    symbolism: string
  },

  eventData: {
    eventType: string,             // creation, flood, battle, etc.
    participants: [string],        // Asset IDs
    location: string,              // Asset ID of place
    dateDescription: string,       // Mythical or historical time
    outcome: string,
    significance: string,
    relatedEvents: [string]        // Asset IDs
  },

  // Cross-References
  relatedAssets: [
    {
      assetId: string,
      relationType: string,        // 'parent' | 'child' | 'spouse' | 'enemy' | 'location' | 'associated'
      description: string
    }
  ],

  relatedTexts: [string],          // Asset IDs of texts mentioning this
  relatedTheories: [string],       // Theory IDs discussing this

  // Media & Resources
  images: [
    {
      url: string,
      caption: string,
      source: string,
      isPrimary: boolean
    }
  ],

  externalLinks: [
    {
      url: string,
      title: string,
      type: string                 // 'wikipedia' | 'academic' | 'reference'
    }
  ],

  // Sources & Attribution
  sources: string,                 // Academic sources
  primarySources: [string],        // Ancient texts, inscriptions
  scholarlyReferences: [string],

  // Community Data
  contributedBy: string,           // User UID (null if official)
  approvedBy: string,              // Admin/moderator UID
  isOfficial: boolean,             // Migrated from official content
  status: string,                  // 'draft' | 'published' | 'approved'

  votes: {
    upvotes: number,
    downvotes: number,
    score: number
  },

  views: number,
  edits: [
    {
      userId: string,
      timestamp: timestamp,
      changes: string,
      approved: boolean
    }
  ],

  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp
}
```

**Indexes:**
1. `assetType` + `mythology` + `name`
2. `mythology` + `status` + `votes.score` (desc)
3. `assetType` + `status` + `createdAt` (desc)
4. `alternateNames` (array) + `mythology`
5. `isOfficial` + `mythology` + `assetType`
6. Array indexes for relatedAssets, relatedTexts

---

### 4. `pages` Collection
Site structure and navigation (for dynamic page generation).

```javascript
{
  id: string,                      // Page slug
  path: string,                    // URL path
  mythology: string,               // Which mythology

  // Page Metadata
  title: string,
  subtitle: string,
  icon: string,                    // Emoji or icon class
  headerSVG: string,               // Custom header graphic

  // Content
  sections: [
    {
      id: string,
      title: string,
      icon: string,
      type: string,                // 'text' | 'grid' | 'list' | 'tree'
      content: string,

      // Dynamic queries
      queryType: string,           // 'assets' | 'theories' | 'static'
      queryFilters: {
        assetType: string,
        mythology: string,
        /* other filters */
      },

      // Static content
      items: [
        {
          title: string,
          icon: string,
          link: string,
          description: string
        }
      ]
    }
  ],

  // Navigation
  parentPage: string,              // Parent page ID
  childPages: [string],            // Child page IDs
  siblingPages: [string],
  breadcrumbs: [
    {
      title: string,
      path: string
    }
  ],

  // SEO & Metadata
  metaDescription: string,
  keywords: [string],
  ogImage: string,

  // Status
  isOfficial: boolean,
  status: string,                  // 'published' | 'draft'

  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**
- `mythology` + `status`
- `path` (unique)
- `parentPage` + `status`

---

### 5. `taxonomies` Collection
Hierarchical category system.

```javascript
{
  id: string,                      // Taxonomy ID
  name: string,                    // Display name
  type: string,                    // 'mythology' | 'section' | 'topic'

  // Hierarchy
  parentId: string,                // Parent taxonomy ID
  ancestors: [string],             // All ancestor IDs
  depth: number,                   // Hierarchy depth

  // Metadata
  icon: string,
  description: string,

  // Counts
  assetCount: number,
  theoryCount: number,

  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 6. `votes` Collection
User voting records.

```javascript
{
  id: string,                      // Auto-generated
  userId: string,                  // Voter UID
  targetType: string,              // 'theory' | 'asset'
  targetId: string,                // Theory or asset ID
  vote: number,                    // 1 or -1
  createdAt: timestamp
}
```

**Indexes:**
- Composite: `userId` + `targetType` + `targetId` (unique)
- `targetId` + `vote`

---

### 7. `bookmarks` Collection
User bookmarks/favorites.

```javascript
{
  id: string,
  userId: string,
  targetType: string,              // 'theory' | 'asset' | 'page'
  targetId: string,
  notes: string,                   // User notes
  tags: [string],                  // User tags
  createdAt: timestamp
}
```

**Indexes:**
- `userId` + `createdAt` (desc)
- Composite: `userId` + `targetType` + `targetId` (unique)

---

### 8. `comments` Collection
Community discussion.

```javascript
{
  id: string,
  targetType: string,              // 'theory' | 'asset'
  targetId: string,

  authorId: string,
  authorName: string,
  content: string,

  // Threading
  parentId: string,                // Parent comment ID (null for top-level)
  depth: number,                   // Reply depth

  // Moderation
  status: string,                  // 'published' | 'flagged' | 'removed'
  flags: number,

  votes: {
    upvotes: number,
    downvotes: number
  },

  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**
- `targetId` + `status` + `createdAt` (desc)
- `authorId` + `createdAt` (desc)
- `parentId` + `createdAt`

---

### 9. `notifications` Collection
User notifications.

```javascript
{
  id: string,
  userId: string,                  // Recipient
  type: string,                    // 'vote' | 'comment' | 'approval' | 'mention'

  title: string,
  message: string,
  link: string,

  read: boolean,
  createdAt: timestamp
}
```

**Indexes:**
- `userId` + `read` + `createdAt` (desc)

---

### 10. `svgGeneration` Collection
Track AI-generated SVG graphics.

```javascript
{
  id: string,
  userId: string,
  prompt: string,                  // User prompt
  svgCode: string,                 // Generated SVG
  model: string,                   // 'gemini-1.5-flash' etc.

  usedIn: [
    {
      type: string,                // 'theory' | 'asset' | 'panel'
      id: string
    }
  ],

  votes: {
    helpful: number,
    notHelpful: number
  },

  createdAt: timestamp
}
```

---

## 🔧 Firebase Storage Structure

```
/users/{userId}/
  /profile/
    avatar.jpg

/theories/{theoryId}/
  /images/
    image1.jpg
    image2.png

/assets/{assetId}/
  /images/
    primary.jpg
    gallery/
      img1.jpg
      img2.jpg
  /svg/
    symbol.svg

/svg-generated/{svgId}/
  graphic.svg
```

---

## 🔐 Security Rules Summary

```javascript
// theories collection
- create: authenticated users
- read: public if published, owner if draft
- update: owner only
- delete: owner only

// assets collection
- create: authenticated users
- read: public if approved/published
- update: owner or moderators
- delete: owner or admins

// votes collection
- create: authenticated, one vote per user per item
- read: public aggregates, own votes
- update: own votes only
- delete: own votes only

// comments collection
- create: authenticated users
- read: public if target is public
- update: own comments within 15 minutes
- delete: own comments or moderators
```

---

## 📊 Migration Strategy

### Phase 1: Schema Setup
1. ✅ Create all Firestore collections
2. ✅ Set up composite indexes
3. ✅ Deploy security rules
4. ✅ Configure Storage buckets

### Phase 2: User Submissions (Current)
1. ✅ Users submit to `theories` collection
2. ✅ Support all asset types with metadata
3. ✅ Icon and SVG panel support
4. ✅ Browse and view pages work with theories

### Phase 3: Asset Migration
1. Create migration script
2. Parse existing HTML mythology pages
3. Extract content into structured data
4. Populate `assets` collection with official content
5. Set `isOfficial: true` flag
6. Maintain URL compatibility with redirects

### Phase 4: Page Generation
1. Migrate page structure to `pages` collection
2. Build dynamic page renderer
3. Query assets/theories for content
4. Maintain static pages as fallback

### Phase 5: Community Features
1. Enable voting system
2. Enable comments
3. Enable bookmarks
4. Add moderation tools
5. User reputation system

---

## 🎯 Key Design Decisions

1. **Unified Asset Schema**: Single `assets` collection with type-specific sub-documents
   - Easier querying across types
   - Consistent structure
   - Flexible for new types

2. **Rich Content Panels**: Same panel structure for theories and assets
   - Reusable components
   - Consistent editing experience
   - SVG and icon support throughout

3. **Separation of Concerns**: Theories vs Assets
   - Theories = analyses and user insights
   - Assets = canonical mythology content
   - Assets can have multiple theories

4. **Official + Community**: Both coexist
   - `isOfficial` flag distinguishes
   - Community can suggest edits to official
   - Moderation workflow for approval

5. **Cross-Linking**: Relationship arrays
   - Assets link to related assets
   - Theories link to assets they discuss
   - Maintain referential integrity

6. **Icon + SVG Everywhere**: Visual richness
   - Icons on all titles and headers
   - Custom SVG symbols for assets
   - AI-generated graphics support
   - Stored as code (not files) for flexibility

---

## 📈 Scalability Considerations

- **Denormalization**: Store author names with theories to reduce reads
- **Counters**: Aggregate votes/views in document for performance
- **Pagination**: All queries support cursor-based pagination
- **Caching**: Use Cloud Functions to maintain aggregates
- **Search**: Integrate Algolia or similar for full-text search
- **CDN**: Cloud Storage + CDN for images
- **Indexes**: Composite indexes for all query patterns

---

**Status**: 🚀 Ready for implementation
**Next**: Update Firestore rules and indexes, implement icon/SVG features
