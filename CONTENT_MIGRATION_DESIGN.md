# Content Migration & Default Content System - Design Document

## Overview

This document outlines the design for migrating existing HTML mythology content into Firestore and creating a unified content system that handles both **default (official) content** and **user-submitted content**.

---

## 1. Data Model Design

### 1.1 Unified Content Schema

All content (default and user-submitted) will use a standardized Firestore schema with content-type-specific extensions.

#### Base Schema (All Content Types)

```typescript
interface BaseContent {
  // Identity
  id: string;                    // Unique identifier
  contentType: ContentType;      // 'deity' | 'hero' | 'creature' | 'place' | 'concept' | 'ritual' | 'text' | 'magic' | 'archetype' | 'herb' | 'symbol'

  // Core Info
  title: string;                 // Display name (e.g., "Zeus")
  subtitle?: string;             // Secondary title (e.g., "King of the Gods")
  summary: string;               // Brief description (1-3 sentences)

  // Rich Content
  richContent: {
    panels: Panel[];             // Structured content panels (existing system)
  };

  // Taxonomy
  mythology: string;             // 'greek' | 'egyptian' | 'norse' | 'christian' | etc.
  mythologyName: string;         // "Greek Mythology"
  section: string;               // 'deities' | 'heroes' | 'creatures' | etc.
  sectionName: string;           // "Deities"

  // Categorization
  tags: string[];                // Searchable tags
  relatedContent: string[];      // IDs of related content
  relatedMythologies: string[];  // Cross-mythology connections

  // Media
  icon: string;                  // Emoji or Unicode symbol
  imageUrl?: string;             // Optional image URL
  imageUrls?: string[];          // Gallery images

  // Source & Attribution
  isDefault: boolean;            // TRUE for official content, FALSE for user submissions
  authorId?: string;             // User ID (null for defaults)
  authorName?: string;           // Display name (null for defaults)
  authorAvatar?: string;         // Avatar URL (null for defaults)
  sources: string;               // Citations, references

  // Metadata
  status: 'published' | 'draft' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';

  // Stats
  views: number;
  votes: number;
  commentsCount: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}
```

#### Content Type Enum

```typescript
enum ContentType {
  DEITY = 'deity',
  HERO = 'hero',
  CREATURE = 'creature',
  PLACE = 'place',
  CONCEPT = 'concept',
  RITUAL = 'ritual',
  TEXT = 'text',
  MAGIC = 'magic',
  ARCHETYPE = 'archetype',
  HERB = 'herb',
  SYMBOL = 'symbol',
  COSMOLOGY = 'cosmology',
  LINEAGE = 'lineage',
  EVENT = 'event'
}
```

### 1.2 Content-Type-Specific Extensions

Each content type has additional structured fields:

#### Deity Schema

```typescript
interface DeityContent extends BaseContent {
  contentType: 'deity';

  // Deity-Specific
  attributes: {
    titles: string[];            // ["Sky Father", "Cloud Gatherer"]
    domains: string[];           // ["sky", "thunder", "justice"]
    symbols: string[];           // ["thunderbolt", "eagle", "oak"]
    sacredAnimals: string[];     // ["eagle", "bull"]
    sacredPlants: string[];      // ["oak", "olive"]
    consorts: string[];          // IDs or names
    children: string[];          // IDs or names
    parents: string[];           // IDs or names
    siblings: string[];          // IDs or names
  };

  // Associations
  pantheon?: string;             // "Olympian", "Aesir", "Ennead"
  role: string;                  // "King of Gods", "War God", etc.
  alignment?: string;            // "Lawful Good", "Chaotic Neutral"

  // Worship
  festivals: string[];           // Festival names
  offerings: string[];           // Typical offerings
  temples: string[];             // Major temple locations
  epithets: string[];            // Alternative names
}
```

#### Hero Schema

```typescript
interface HeroContent extends BaseContent {
  contentType: 'hero';

  // Hero-Specific
  attributes: {
    epithet: string;             // "The Great", "Cunning"
    parentage: string[];         // Parent names/IDs
    notableDeeds: string[];      // List of accomplishments
    weapons: string[];           // Famous weapons/items
    companions: string[];        // Named companions
    fateOrDeath: string;         // How they died/ended
  };

  // Classification
  heroType: string;              // "Demigod", "Mortal", "Legendary King"
  isHistorical: boolean;         // Possibly based on real person
  timePeriod?: string;           // "Mycenaean Age", "Bronze Age"
}
```

#### Creature Schema

```typescript
interface CreatureContent extends BaseContent {
  contentType: 'creature';

  // Creature-Specific
  attributes: {
    species: string;             // "Gorgon", "Dragon", "Hybrid"
    appearance: string;          // Physical description
    abilities: string[];         // Special powers
    weaknesses: string[];        // Known vulnerabilities
    habitat: string;             // Where it lives
    origin: string;              // Creation story
    slainBy?: string;            // Hero who defeated it (if any)
  };

  // Classification
  creatureType: string;          // "Monster", "Divine Beast", "Spirit"
  alignment: string;             // "Hostile", "Neutral", "Benevolent"
  intelligence: string;          // "Bestial", "Human-level", "Divine"
}
```

#### Place Schema

```typescript
interface PlaceContent extends BaseContent {
  contentType: 'place';

  // Place-Specific
  attributes: {
    locationType: string;        // "Mountain", "Underworld", "Island"
    geography: string;           // Physical description
    inhabitants: string[];       // Who lives there
    significance: string;        // Why it's important
    access: string;              // How to reach it
    regions?: string[];          // Sub-locations
  };

  // Location
  realWorldLocation?: string;    // Modern location if applicable
  realm: string;                 // "Mortal World", "Divine Realm", "Underworld"
}
```

#### Concept Schema

```typescript
interface ConceptContent extends BaseContent {
  contentType: 'concept';

  // Concept-Specific
  attributes: {
    definition: string;          // What it means
    significance: string;        // Why it matters
    manifestations: string[];    // How it appears in myths
    opposingConcept?: string;    // Counterpart concept
    relatedVirtues: string[];    // Associated values
  };

  // Classification
  conceptType: string;           // "Virtue", "Force", "Principle"
  universality: string;          // "Pan-Hellenic", "Local", "Universal"
}
```

#### Ritual/Magic Schema

```typescript
interface RitualContent extends BaseContent {
  contentType: 'ritual' | 'magic';

  // Ritual-Specific
  attributes: {
    purpose: string;             // Goal of ritual
    participants: string[];      // Who performs it
    materials: string[];         // Required items
    steps: string[];             // How to perform
    timing?: string;             // When to perform
    location?: string;           // Where to perform
    deity?: string;              // Associated deity
  };

  // Classification
  ritualType: string;            // "Divination", "Healing", "Protection"
  difficulty: string;            // "Common", "Priestly", "Secret"
}
```

#### Sacred Herb/Plant Schema

```typescript
interface HerbContent extends BaseContent {
  contentType: 'herb';

  // Herb-Specific
  attributes: {
    scientificName?: string;     // Botanical name
    appearance: string;          // Physical description
    habitat: string;             // Where it grows
    harvestTime?: string;        // When to collect
    properties: string[];        // Medicinal/magical properties
    uses: string[];              // Traditional uses
    deity?: string;              // Associated deity
    myths: string[];             // Associated stories
  };

  // Classification
  herbType: string;              // "Medicinal", "Sacred", "Both"
  toxicity?: string;             // Safety information
}
```

#### Symbol Schema

```typescript
interface SymbolContent extends BaseContent {
  contentType: 'symbol';

  // Symbol-Specific
  attributes: {
    meaning: string;             // What it represents
    usage: string[];             // How it's used
    associatedDeities: string[]; // Which gods use it
    culturalContext: string;     // Historical context
    variations: string[];        // Different forms
  };

  // Visual
  visualDescription: string;     // How to recognize it
  unicode?: string;              // Unicode symbol if available
}
```

---

## 2. Firestore Collection Structure

### 2.1 Collection Organization

```
/content
  /{contentId}
    - All fields from unified schema
    - Indexed by: contentType, mythology, section, isDefault, status

/content-metadata
  /stats
    - Global statistics
    - Content counts by type/mythology

/users
  /{userId}
    /submissions
      - User's submitted content IDs
    /favorites
      - Bookmarked content IDs

/comments
  /{contentId}
    /comments
      /{commentId}
        - Comment data

/votes
  /{contentId}
    /votes
      /{userId}
        - Vote data (upvote/downvote)
```

### 2.2 Indexes Required

```javascript
// Firestore composite indexes
[
  {
    collection: 'content',
    fields: [
      { field: 'isDefault', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'mythology', order: 'ASCENDING' },
      { field: 'contentType', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'content',
    fields: [
      { field: 'contentType', order: 'ASCENDING' },
      { field: 'mythology', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'content',
    fields: [
      { field: 'isDefault', order: 'ASCENDING' },
      { field: 'contentType', order: 'ASCENDING' },
      { field: 'views', order: 'DESCENDING' }
    ]
  }
]
```

---

## 3. HTML Content Extraction Strategy

### 3.1 HTML Parser Design

Create a content extraction system that parses existing HTML files:

```javascript
class ContentExtractor {
  // Extract metadata from HTML structure
  extractMetadata(html, filePath) {
    // Parse: mythology, section, contentType from file path
    // e.g., mythos/greek/deities/zeus.html
    //   -> mythology: 'greek'
    //   -> section: 'deities'
    //   -> contentType: 'deity'

    return {
      mythology: extractMythologyFromPath(filePath),
      section: extractSectionFromPath(filePath),
      contentType: inferContentType(filePath),
      filename: extractFilename(filePath)
    };
  }

  // Extract structured content from HTML
  extractContent(html) {
    // Title: <h1> or <h2> in deity-header
    // Subtitle: .subtitle
    // Icon: emoji in header
    // Attributes: .attribute-card elements
    // Content panels: section elements

    return {
      title: extractTitle(html),
      subtitle: extractSubtitle(html),
      icon: extractIcon(html),
      attributes: extractAttributes(html),
      panels: extractContentPanels(html)
    };
  }

  // Convert HTML sections to rich content panels
  extractContentPanels(html) {
    // Each <section> becomes a panel
    // Detect panel type from headers and content

    return sections.map(section => ({
      type: inferPanelType(section),
      title: extractSectionTitle(section),
      content: extractSectionContent(section),
      style: inferPanelStyle(section)
    }));
  }
}
```

### 3.2 Content Type Detection

```javascript
function inferContentType(filePath) {
  if (filePath.includes('/deities/')) return 'deity';
  if (filePath.includes('/heroes/')) return 'hero';
  if (filePath.includes('/creatures/')) return 'creature';
  if (filePath.includes('/places/') || filePath.includes('/cosmology/')) return 'place';
  if (filePath.includes('/concepts/')) return 'concept';
  if (filePath.includes('/rituals/')) return 'ritual';
  if (filePath.includes('/magic/')) return 'magic';
  if (filePath.includes('/herbs/')) return 'herb';
  if (filePath.includes('/symbols/')) return 'symbol';
  if (filePath.includes('/archetypes/')) return 'archetype';
  if (filePath.includes('/texts/')) return 'text';

  return 'concept'; // default fallback
}
```

### 3.3 Attribute Extraction Patterns

Different HTML structures map to different content types:

```javascript
// Deity attribute extraction
function extractDeityAttributes($) {
  const attributes = {
    titles: [],
    domains: [],
    symbols: [],
    sacredAnimals: [],
    sacredPlants: [],
    // ... etc
  };

  $('.attribute-card').each((i, card) => {
    const label = $(card).find('.attribute-label').text().toLowerCase();
    const value = $(card).find('.attribute-value').text();

    if (label.includes('title')) {
      attributes.titles = value.split(',').map(s => s.trim());
    } else if (label.includes('domain')) {
      attributes.domains = value.split(',').map(s => s.trim());
    }
    // ... map other attributes
  });

  return attributes;
}
```

---

## 4. Migration Process Design

### 4.1 Multi-Phase Migration

#### Phase 1: Inventory & Analysis
1. Scan all HTML files in `mythos/` directory
2. Categorize by content type and mythology
3. Generate migration report with counts and issues
4. Identify special cases (complex layouts, missing data)

#### Phase 2: Extraction & Validation
1. Run HTML parser on each file
2. Extract structured data
3. Validate against schema
4. Generate preview JSON for manual review
5. Flag low-confidence extractions

#### Phase 3: Data Transformation
1. Convert HTML content to rich content panels
2. Normalize attribute names and values
3. Generate default IDs (e.g., `default_greek_deity_zeus`)
4. Set `isDefault: true` for all migrated content
5. Add created/updated timestamps

#### Phase 4: Firestore Upload
1. Batch upload to Firestore (500 docs per batch)
2. Create proper indexes
3. Verify upload success
4. Generate upload report with success/failure counts

#### Phase 5: Verification
1. Query Firestore to verify data integrity
2. Spot-check random samples
3. Verify relationships (parents, children, etc.)
4. Test search and filter functionality

### 4.2 Migration Script Architecture

```javascript
class ContentMigrationTool {
  constructor() {
    this.extractedContent = [];
    this.failedExtractions = [];
    this.stats = {
      totalFiles: 0,
      successful: 0,
      failed: 0,
      byType: {},
      byMythology: {}
    };
  }

  // Main migration flow
  async migrate() {
    // 1. Discover files
    const files = await this.discoverContentFiles();
    this.stats.totalFiles = files.length;

    // 2. Extract content
    for (const file of files) {
      try {
        const content = await this.extractFile(file);
        this.extractedContent.push(content);
        this.stats.successful++;
      } catch (error) {
        this.failedExtractions.push({ file, error });
        this.stats.failed++;
      }
    }

    // 3. Validate
    const validationResults = await this.validate();

    // 4. Generate preview
    await this.generatePreview();

    // 5. Upload (if approved)
    if (this.userConfirms()) {
      await this.uploadToFirestore();
    }

    // 6. Report
    return this.generateReport();
  }

  async discoverContentFiles() {
    // Recursively find all HTML files in mythos/
    // Exclude: index.html, corpus-search.html, etc.
    // Include: deity/*.html, heroes/*.html, etc.
  }

  async extractFile(filePath) {
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    const metadata = this.extractMetadata(filePath);
    const content = this.extractContent($, metadata.contentType);
    const attributes = this.extractAttributes($, metadata.contentType);

    return {
      ...metadata,
      ...content,
      attributes,
      isDefault: true,
      status: 'published',
      visibility: 'public',
      authorId: null,
      authorName: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async uploadToFirestore() {
    const batch = firebase.firestore().batch();
    let batchCount = 0;

    for (const content of this.extractedContent) {
      const docId = `default_${content.mythology}_${content.contentType}_${slugify(content.title)}`;
      const ref = firebase.firestore().collection('content').doc(docId);

      batch.set(ref, content);
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }
}
```

---

## 5. Content Rendering System

### 5.1 Dynamic Page Generation

Replace static HTML pages with dynamic content loading:

```javascript
class ContentRenderer {
  async renderContentPage(contentId) {
    // 1. Fetch from Firestore
    const content = await this.fetchContent(contentId);

    // 2. Choose template based on content type
    const template = this.getTemplate(content.contentType);

    // 3. Render rich content panels
    const renderedPanels = this.renderPanels(content.richContent.panels);

    // 4. Render attributes
    const renderedAttributes = this.renderAttributes(
      content.attributes,
      content.contentType
    );

    // 5. Assemble page
    return template({
      ...content,
      renderedPanels,
      renderedAttributes
    });
  }

  // Render different content types with appropriate layouts
  getTemplate(contentType) {
    const templates = {
      deity: this.deityTemplate,
      hero: this.heroTemplate,
      creature: this.creatureTemplate,
      place: this.placeTemplate,
      // ... etc
    };

    return templates[contentType] || this.defaultTemplate;
  }

  // Render attribute cards based on content type
  renderAttributes(attributes, contentType) {
    const renderer = this.attributeRenderers[contentType];
    return renderer ? renderer(attributes) : this.defaultAttributeRenderer(attributes);
  }
}
```

### 5.2 Content Loading Strategy

**Option A: Hybrid Approach (Recommended)**
- Keep static HTML for SEO and performance
- Add dynamic enhancement layer for user submissions
- Default content rendered from HTML (fast)
- User content rendered from Firestore (dynamic)
- Merge both in browse/search views

**Option B: Full Dynamic**
- Replace all HTML pages with dynamic loaders
- Fetch all content from Firestore
- Better for consistency, harder for SEO
- Requires server-side rendering or static generation

**Option C: Static Generation**
- Generate static HTML from Firestore on build
- Best of both worlds
- Requires build pipeline
- Regular rebuilds for user content

### 5.3 Content Display Components

```javascript
// Unified content card component
class ContentCard {
  render(content) {
    return `
      <div class="content-card" data-content-id="${content.id}" data-type="${content.contentType}">
        <div class="content-card-header">
          <span class="content-icon">${content.icon}</span>
          <h3 class="content-title">${content.title}</h3>
          ${!content.isDefault ? this.renderUserBadge(content) : ''}
        </div>
        <p class="content-summary">${content.summary}</p>
        <div class="content-meta">
          <span class="content-type">${content.contentType}</span>
          <span class="content-mythology">${content.mythologyName}</span>
          ${this.renderStats(content)}
        </div>
      </div>
    `;
  }

  renderUserBadge(content) {
    return `
      <div class="user-submitted-badge">
        <img src="${content.authorAvatar}" class="author-avatar-sm">
        <span>by ${content.authorName}</span>
      </div>
    `;
  }
}
```

---

## 6. Submission Form Expansion

### 6.1 Content Type Selector

Expand the existing submission form to support all content types:

```javascript
// Enhanced contribution type
const contributionTypes = [
  { value: 'deity', label: 'Deity/God', icon: '⚡' },
  { value: 'hero', label: 'Hero/Legendary Figure', icon: '🦸' },
  { value: 'creature', label: 'Creature/Monster', icon: '🐉' },
  { value: 'place', label: 'Place/Location', icon: '🏛️' },
  { value: 'concept', label: 'Concept/Principle', icon: '💭' },
  { value: 'ritual', label: 'Ritual/Ceremony', icon: '🕯️' },
  { value: 'magic', label: 'Magic/Spell', icon: '✨' },
  { value: 'herb', label: 'Sacred Plant/Herb', icon: '🌿' },
  { value: 'symbol', label: 'Symbol/Emblem', icon: '☥' },
  { value: 'text', label: 'Sacred Text/Scripture', icon: '📜' },
  { value: 'archetype', label: 'Archetype/Pattern', icon: '🔮' },
  { value: 'theory', label: 'General Theory/Analysis', icon: '💡' }
];
```

### 6.2 Dynamic Form Fields

Show different fields based on selected content type:

```javascript
class DynamicSubmissionForm {
  updateFormFields(contentType) {
    // Hide all optional sections
    this.hideAllOptionalSections();

    // Show relevant sections based on type
    switch(contentType) {
      case 'deity':
        this.showSection('deity-attributes');
        this.showFields(['titles', 'domains', 'symbols', 'pantheon']);
        break;

      case 'hero':
        this.showSection('hero-attributes');
        this.showFields(['epithet', 'parentage', 'notableDeeds']);
        break;

      case 'creature':
        this.showSection('creature-attributes');
        this.showFields(['species', 'abilities', 'weaknesses']);
        break;

      // ... etc for each type
    }

    // Always show: title, summary, rich content, sources
    this.ensureCoreFieldsVisible();
  }
}
```

---

## 7. Browse & Search Integration

### 7.1 Unified Browse View

Combine default and user content in browse pages:

```javascript
class UnifiedContentBrowser {
  async loadContent(filters) {
    let query = firebase.firestore()
      .collection('content')
      .where('status', '==', 'published');

    // Apply content filter mode
    const filterMode = window.contentFilter.getMode();
    if (filterMode === 'defaults-only') {
      query = query.where('isDefault', '==', true);
    } else if (filterMode === 'defaults-self') {
      // Firestore doesn't support OR queries directly
      // Need to fetch separately and merge
      const defaults = await this.fetchDefaults(filters);
      const userContent = await this.fetchUserContent(filters);
      return this.mergeAndSort([...defaults, ...userContent]);
    }

    // Apply other filters
    if (filters.mythology) {
      query = query.where('mythology', '==', filters.mythology);
    }
    if (filters.contentType) {
      query = query.where('contentType', '==', filters.contentType);
    }

    return await query.get();
  }

  mergeAndSort(contents) {
    // Prioritize default content, then sort by relevance/date
    return contents.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.createdAt - a.createdAt;
    });
  }
}
```

### 7.2 Search Enhancement

```javascript
class ContentSearch {
  async search(query, filters = {}) {
    // Client-side search (for now)
    // Future: Algolia or Elasticsearch integration

    const allContent = await this.loadContent(filters);

    return allContent.filter(content => {
      const searchableText = [
        content.title,
        content.subtitle,
        content.summary,
        content.tags.join(' '),
        JSON.stringify(content.attributes)
      ].join(' ').toLowerCase();

      return searchableText.includes(query.toLowerCase());
    });
  }
}
```

---

## 8. Display Strategy

### 8.1 Badge System

Visual indicators to distinguish content sources:

```html
<!-- Default Content Badge -->
<span class="official-badge">
  <span class="badge-icon">✓</span>
  Official
</span>

<!-- User Content Badge -->
<span class="user-badge">
  <img src="avatar.jpg" class="badge-avatar">
  <span class="badge-text">by UserName</span>
</span>

<!-- Community Featured Badge -->
<span class="featured-badge">
  <span class="badge-icon">⭐</span>
  Community Featured
</span>
```

### 8.2 Content Merging in Views

**Browse Page:**
- Default content shown first by default
- User content integrated based on filter mode
- Clear visual distinction
- Separate sections or mixed with badges

**Detail Page:**
- Primary content (default or featured user submission)
- Related user submissions in sidebar
- "Alternative Interpretations" section
- Community contributions section

**Index Pages:**
- Keep static official content
- Add "Community Additions" section
- Dynamic injection of user content

---

## 9. Implementation Phases

### Phase 1: Schema & Infrastructure (Week 1)
- [ ] Define complete Firestore schema
- [ ] Create indexes
- [ ] Extend firebase-db.js for new content types
- [ ] Create base content classes

### Phase 2: Migration Tool (Week 2)
- [ ] Build HTML content extractor
- [ ] Create content type detection logic
- [ ] Build attribute extraction for each type
- [ ] Generate migration preview/report

### Phase 3: Data Migration (Week 3)
- [ ] Run extraction on all HTML files
- [ ] Manual review of extracted data
- [ ] Fix low-confidence extractions
- [ ] Upload to Firestore

### Phase 4: Rendering System (Week 4)
- [ ] Create content renderer components
- [ ] Build template system
- [ ] Add dynamic content loading
- [ ] Integrate with existing pages

### Phase 5: Form Expansion (Week 5)
- [ ] Expand submission form for all types
- [ ] Add content-type-specific fields
- [ ] Update validation logic
- [ ] Test submission flow

### Phase 6: Browse Integration (Week 6)
- [ ] Update browse page for all content types
- [ ] Add content type filters
- [ ] Implement unified search
- [ ] Add badge system

### Phase 7: Testing & Polish (Week 7)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] SEO verification
- [ ] Bug fixes

---

## 10. Technical Considerations

### 10.1 Data Size & Performance

**Estimated Content:**
- ~15 mythologies × ~20 deities each = 300 deities
- ~15 mythologies × ~10 heroes each = 150 heroes
- ~15 mythologies × ~5 creatures each = 75 creatures
- ~100 places/cosmologies
- ~50 concepts
- ~50 rituals/magic
- ~30 herbs
- ~30 symbols
- **Total: ~785 default content items**

**User Content:**
- Unknown, potentially unlimited
- Need pagination (already implemented)
- Need caching strategy

### 10.2 Query Optimization

```javascript
// Cache default content aggressively (changes rarely)
class ContentCache {
  constructor() {
    this.defaultsCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  async getDefaults(mythology, contentType) {
    const cacheKey = `${mythology}_${contentType}`;

    if (this.defaultsCache.has(cacheKey)) {
      const cached = this.defaultsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    // Fetch from Firestore
    const data = await this.fetchFromFirestore(mythology, contentType);

    // Cache it
    this.defaultsCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

### 10.3 SEO Strategy

**Maintain Static HTML:**
- Keep existing HTML files for default content
- Add structured data (JSON-LD)
- Ensure fast initial page load
- Use dynamic enhancement for user content

**Dynamic Content SEO:**
- Server-side rendering for user content URLs
- Generate sitemaps dynamically
- Use meta tags from Firestore data
- Consider static site generation on build

### 10.4 Backward Compatibility

**Preserve URLs:**
- Keep existing `/mythos/greek/deities/zeus.html` URLs
- Add new URLs for Firestore content: `/content/{contentId}`
- Redirect legacy URLs if needed

**Graceful Degradation:**
- Static HTML works without JavaScript
- Progressive enhancement for dynamic features
- Firestore failures fall back to static content

---

## 11. Future Enhancements

### 11.1 Advanced Features

- **Versioning:** Track content revisions
- **Approval System:** Moderator review for user submissions
- **Collaborative Editing:** Multiple users edit same content
- **Content Merging:** Combine multiple user submissions
- **Quality Scoring:** Rank user content by quality
- **AI Enhancement:** Use AI to improve extracted content

### 11.2 Advanced Search

- **Full-text search:** Algolia integration
- **Faceted search:** Filter by multiple attributes
- **Similarity search:** "Find similar deities"
- **Cross-mythology search:** Compare across traditions

### 11.3 Content Relationships

- **Family trees:** Visual deity genealogy
- **Story graphs:** Connected narrative arcs
- **Influence maps:** Cross-cultural connections
- **Timeline views:** Chronological mythology

---

## 12. Success Metrics

### Migration Success:
- [ ] 95%+ of default content successfully extracted
- [ ] 100% of extracted content passes validation
- [ ] No broken pages after migration
- [ ] SEO ranking maintained

### System Performance:
- [ ] Browse page loads in <2s
- [ ] Search returns results in <1s
- [ ] Submission form completes in <3s
- [ ] 99.9% Firestore uptime

### User Adoption:
- [ ] User submissions increase 50%+
- [ ] Browse page engagement increases
- [ ] Search usage increases
- [ ] User retention improves

---

## Summary

This design creates a **unified content system** that:

1. ✅ Uses standardized schema for all content types
2. ✅ Migrates existing HTML to Firestore
3. ✅ Supports both default and user content
4. ✅ Expands submission form for all content types
5. ✅ Provides unified browse/search experience
6. ✅ Maintains backward compatibility
7. ✅ Preserves SEO performance
8. ✅ Enables future enhancements

The system is **flexible, scalable, and user-friendly** while preserving the quality and structure of the existing mythology encyclopedia.
