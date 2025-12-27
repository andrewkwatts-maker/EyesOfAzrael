# Advanced Search System - Implementation Guide

## Overview

The Eyes of Azrael Advanced Search System provides comprehensive search functionality across all mythological content with support for fuzzy matching, faceted filtering, boolean operators, and search analytics.

## Files Created

### 1. Core JavaScript Module
**File:** `js/advanced-search.js`

The main search engine implementing:
- Full-text search with Levenshtein distance fuzzy matching
- Advanced query parsing (boolean operators, wildcards, field-specific)
- Faceted filtering system
- Search analytics and tracking
- Autocomplete and spell correction
- Search result ranking and highlighting

### 2. Search Page
**File:** `search-advanced.html`

Complete search interface featuring:
- Advanced search bar with autocomplete
- Faceted filter sidebar
- Grid/List view toggle
- Sort options
- Pagination
- Search analytics display
- Responsive design

### 3. Styling
**File:** `css/advanced-search.css`

Comprehensive styling including:
- Dark theme optimized for readability
- Responsive layout
- Animated loading states
- Custom scrollbars
- Hover effects and transitions

## Features

### 1. Full-Text Search

**Basic Search:**
```javascript
const results = await advancedSearchSystem.search('Zeus');
```

**Features:**
- Searches across title, subtitle, summary, tags, and rich content
- Typo tolerance using fuzzy matching
- Relevance ranking
- Result highlighting

### 2. Advanced Operators

**Boolean Operators:**
```
thunder AND zeus        // Both terms must match
thunder OR lightning    // Either term must match
zeus NOT roman          // Exclude results containing "roman"
```

**Exact Phrases:**
```
"golden fleece"         // Exact phrase match
"hero's journey"        // Match exact phrase
```

**Wildcards:**
```
zeu*                    // Matches Zeus, Zeugma, etc.
god*                    // Matches god, goddess, gods
```

**Field-Specific:**
```
mythology:greek         // Only Greek mythology
contentType:deity       // Only deities
mythology:norse hero    // Norse heroes
```

### 3. Faceted Filters

Available filters:
- **Mythology:** Greek, Roman, Norse, Egyptian, etc.
- **Content Type:** Deity, Hero, Creature, Place, etc.
- **Domains:** War, Love, Death, Sky, etc. (for deities)
- **Tags:** Custom tags applied to content

**Programmatic Usage:**
```javascript
const results = await advancedSearchSystem.search('war', {
    filters: {
        mythologies: ['greek', 'norse'],
        contentTypes: ['deity'],
        domains: ['war', 'battle']
    }
});
```

### 4. Sort Options

Available sort modes:
- **Relevance:** Best match first (default)
- **Alphabetical:** A-Z by name
- **Newest:** Most recently added
- **Popular:** Most voted/liked
- **Views:** Most viewed

### 5. Search Suggestions

**Autocomplete:**
As you type, suggestions appear from:
- Existing entity titles
- Previous search history
- Popular searches

**Spell Correction:**
"Did you mean?" suggestions for typos using fuzzy matching

**Related Searches:**
Suggestions based on search results (tags, mythology, content type)

### 6. Search Analytics

**Tracked Metrics:**
- All search queries with timestamps
- Popular searches (frequency count)
- No-results queries (for content improvement)
- Popular entities (view tracking)
- Search trends (time-based analysis)

**Access Analytics:**
```javascript
// Get popular searches
const popular = advancedSearchSystem.getPopularSearches(10);

// Get search trends (last 7 days)
const trends = advancedSearchSystem.getSearchTrends(7);

// Get popular entities
const popularEntities = advancedSearchSystem.getPopularEntities(10);
```

## Implementation Options

The system currently uses **Option A: Firestore-only** implementation for:
- ✅ Zero additional cost
- ✅ Fast performance for small-medium datasets
- ✅ No external dependencies
- ✅ Offline support via Firebase persistence
- ✅ Simple deployment

### Option A: Firestore-only (Current Implementation)

**Pros:**
- Free tier friendly
- No external services required
- Offline support
- Simple to maintain

**Cons:**
- Limited fuzzy matching (client-side only)
- Performance may degrade with very large datasets (1000+ entities)
- All search processing happens client-side

**When to Use:**
- < 1000 searchable entities
- Budget constraints
- Simple deployment requirements

### Option B: Algolia Integration (Recommended for Scale)

**To Upgrade to Algolia:**

1. **Install Algolia:**
```html
<script src="https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.umd.js"></script>
```

2. **Initialize Algolia:**
```javascript
const algoliaClient = algoliasearch('YOUR_APP_ID', 'YOUR_SEARCH_KEY');
const searchIndex = algoliaClient.initIndex('mythology_content');
```

3. **Modify Search Method:**
```javascript
async search(query, options = {}) {
    const { hits } = await searchIndex.search(query, {
        filters: this.buildAlgoliaFilters(options.filters),
        hitsPerPage: options.limit || 100
    });
    return this.formatAlgoliaResults(hits);
}
```

4. **Sync Firestore to Algolia:**
Use Firebase Cloud Functions to automatically sync:
```javascript
exports.syncToAlgolia = functions.firestore
    .document('content/{contentId}')
    .onWrite(async (change, context) => {
        const data = change.after.data();
        await searchIndex.saveObject({
            objectID: context.params.contentId,
            ...data
        });
    });
```

**Algolia Pros:**
- Instant search results
- Built-in typo tolerance
- Faceted search out of the box
- Handles millions of records
- Geo-search capabilities

**Algolia Cons:**
- Cost scales with usage
- External dependency
- Requires Cloud Functions for sync

**Pricing:**
- Free tier: 10,000 searches/month
- Build plan: $0.50 per 1,000 searches after free tier

### Option C: Elasticsearch (Self-Hosted)

**For Maximum Control:**

Best for:
- Very large datasets (10,000+ entities)
- Complex query requirements
- On-premise requirements
- Full control over infrastructure

**Implementation:**
Requires separate Elasticsearch server and custom integration.

## Usage Examples

### Basic Search
```javascript
// Initialize
await advancedSearchSystem.init();

// Simple search
const results = await advancedSearchSystem.search('Zeus');

// Access results
results.results.forEach(result => {
    console.log(result.title);
    console.log(result.highlightedSummary);
    console.log(result.searchScore);
});
```

### Advanced Search
```javascript
// Complex query with all features
const results = await advancedSearchSystem.search(
    'war AND (greek OR norse) NOT roman',
    {
        filters: {
            contentTypes: ['deity'],
            domains: ['war', 'battle']
        },
        sortBy: 'popular',
        limit: 20
    }
);
```

### Autocomplete Integration
```javascript
// Get suggestions as user types
const input = document.getElementById('searchInput');
input.addEventListener('input', async (e) => {
    const suggestions = await advancedSearchSystem.getAutocompleteSuggestions(
        e.target.value,
        10 // max suggestions
    );
    displaySuggestions(suggestions);
});
```

### Faceted Filters
```javascript
// Get available filter options
const facets = await advancedSearchSystem.getAvailableFacets();

// facets contains:
// - mythologies: ['greek', 'roman', 'norse', ...]
// - contentTypes: ['deity', 'hero', 'creature', ...]
// - domains: ['war', 'love', 'death', ...]
// - tags: ['creation', 'underworld', ...]

// Use in UI to populate filter checkboxes
```

### Analytics Dashboard
```javascript
// Popular searches
const popular = advancedSearchSystem.getPopularSearches(10);
popular.forEach(({ query, count }) => {
    console.log(`${query}: ${count} searches`);
});

// Trending searches (last 7 days)
const trends = advancedSearchSystem.getSearchTrends(7);
trends.forEach(({ query, count, avgResults }) => {
    console.log(`${query}: ${count} searches, avg ${avgResults} results`);
});

// Popular entities
const entities = advancedSearchSystem.getPopularEntities(10);
entities.forEach(({ title, views }) => {
    console.log(`${title}: ${views} views`);
});
```

## Configuration

Modify search behavior in `js/advanced-search.js`:

```javascript
this.config = {
    fuzzyThreshold: 0.7,      // Minimum similarity (0-1)
    maxResults: 100,          // Maximum results to return
    minQueryLength: 2,        // Minimum query length
    cacheTimeout: 300000,     // Cache duration (5 min)
    highlightTag: 'mark',     // HTML tag for highlighting
    debounceDelay: 300        // Autocomplete delay (ms)
};
```

## Performance Optimization

### 1. Search Index
The search index is built on initialization from Firestore. For large datasets:

```javascript
// Refresh index periodically
setInterval(async () => {
    await advancedSearchSystem.refreshIndex();
}, 3600000); // Every hour
```

### 2. Caching
Results are cached for 5 minutes by default. Clear cache when needed:

```javascript
advancedSearchSystem.clearCache();
```

### 3. Pagination
Limit results per page to improve rendering performance:

```javascript
const resultsPerPage = 20; // Adjust as needed
```

## SEO Considerations

### 1. Server-Side Rendering
For better SEO, consider pre-rendering search results:

```javascript
// Use Firebase Cloud Functions to pre-render popular searches
exports.renderSearch = functions.https.onRequest(async (req, res) => {
    const query = req.query.q;
    const results = await performServerSearch(query);
    res.send(renderSearchPage(results));
});
```

### 2. URL Parameters
The search page should use URL parameters for sharing:

```javascript
// Update URL when searching
const url = new URL(window.location);
url.searchParams.set('q', query);
window.history.pushState({}, '', url);

// Read query from URL on load
const urlParams = new URLSearchParams(window.location.search);
const initialQuery = urlParams.get('q');
if (initialQuery) {
    performSearch(initialQuery);
}
```

## Testing

### Test Queries

1. **Basic Search:**
   - "Zeus" → Should find Zeus deity
   - "creation" → Should find creation myths
   - "underworld" → Should find underworld-related content

2. **Fuzzy Matching:**
   - "Zues" → Should suggest "Zeus"
   - "Appollo" → Should suggest "Apollo"

3. **Boolean Operators:**
   - "thunder AND zeus" → Greek thunder god
   - "war OR battle" → War/battle related content
   - "zeus NOT roman" → Zeus but not Roman equivalents

4. **Field-Specific:**
   - "mythology:greek" → All Greek content
   - "contentType:deity mythology:norse" → Norse deities

5. **Wildcards:**
   - "god*" → god, goddess, gods
   - "zeu*" → Zeus, Zeugma

6. **Exact Phrases:**
   - "golden fleece" → Exact phrase match
   - "hero's journey" → Exact archetype match

### Performance Tests

```javascript
// Measure search performance
const start = performance.now();
await advancedSearchSystem.search('zeus');
const duration = performance.now() - start;
console.log(`Search took ${duration}ms`);

// Should be < 100ms for small datasets
// Should be < 500ms for large datasets
```

## Accessibility

The search interface is built with accessibility in mind:

- **Keyboard Navigation:** Full keyboard support
- **ARIA Labels:** Proper labeling for screen readers
- **Focus Management:** Clear focus indicators
- **Contrast:** WCAG AA compliant color contrast

## Mobile Responsiveness

The search interface adapts to all screen sizes:
- Desktop: Two-column layout (sidebar + results)
- Tablet: Single column, collapsible sidebar
- Mobile: Stack layout, simplified filters

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern JavaScript features)

## Future Enhancements

### Phase 1 (Current)
- ✅ Full-text search
- ✅ Fuzzy matching
- ✅ Faceted filters
- ✅ Boolean operators
- ✅ Autocomplete
- ✅ Analytics

### Phase 2 (Planned)
- [ ] Voice search integration
- [ ] Image search (find entities by image)
- [ ] Advanced filters (date ranges, rating)
- [ ] Search within results
- [ ] Export search results
- [ ] Saved searches
- [ ] Search alerts

### Phase 3 (Future)
- [ ] AI-powered semantic search
- [ ] Multi-language support
- [ ] Graph-based entity relationships
- [ ] Personalized search rankings
- [ ] Search recommendations

## Troubleshooting

### Issue: No Results Found

**Possible Causes:**
1. Search index not built
2. Firestore data not migrated
3. Filters too restrictive

**Solutions:**
```javascript
// Check if index is built
console.log(advancedSearchSystem.searchIndex.size);

// Rebuild index
await advancedSearchSystem.refreshIndex();

// Clear filters
searchUI.clearFilters();
```

### Issue: Slow Performance

**Possible Causes:**
1. Large dataset (>1000 entities)
2. Complex queries
3. Multiple active filters

**Solutions:**
```javascript
// Increase cache timeout
advancedSearchSystem.config.cacheTimeout = 600000; // 10 min

// Limit results
const results = await search(query, { limit: 50 });

// Consider upgrading to Algolia for large datasets
```

### Issue: Autocomplete Not Working

**Possible Causes:**
1. Query too short (< 2 chars)
2. No matching results
3. Dropdown CSS issue

**Solutions:**
```javascript
// Check configuration
console.log(advancedSearchSystem.config.minQueryLength);

// Test suggestions manually
const suggestions = await advancedSearchSystem.getAutocompleteSuggestions('zeu');
console.log(suggestions);
```

## Support

For issues or questions:
1. Check this guide
2. Review code comments in `js/advanced-search.js`
3. Check browser console for errors
4. Review Firestore data structure

## License

Part of the Eyes of Azrael project.

## Changelog

### v1.0.0 (2025-12-15)
- Initial implementation
- Firestore-based search
- Fuzzy matching with Levenshtein distance
- Boolean operators (AND, OR, NOT)
- Wildcards and field-specific search
- Faceted filtering
- Autocomplete and spell correction
- Search analytics
- Responsive UI
- Grid/List view toggle
- Pagination
