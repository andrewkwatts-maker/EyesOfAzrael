# Advanced Search System - Quick Reference Card

## Quick Start

```javascript
// Initialize
await advancedSearchSystem.init();

// Basic search
const results = await advancedSearchSystem.search('Zeus');

// Advanced search
const results = await advancedSearchSystem.search('war AND greek', {
    filters: { contentTypes: ['deity'] },
    sortBy: 'popular',
    limit: 20
});
```

## Query Syntax Cheat Sheet

| Syntax | Example | Description |
|--------|---------|-------------|
| Simple text | `Zeus` | Basic search |
| Boolean AND | `thunder AND zeus` | Both terms must match |
| Boolean OR | `war OR battle` | Either term must match |
| Boolean NOT | `zeus NOT roman` | Exclude term |
| Exact phrase | `"golden fleece"` | Exact phrase match |
| Wildcard | `god*` | Matches god, goddess, gods |
| Field-specific | `mythology:greek` | Search specific field |
| Combined | `mythology:greek deity` | Multiple criteria |

## API Reference

### Main Search

```javascript
await advancedSearchSystem.search(query, options)
```

**Parameters:**
- `query` (string): Search query
- `options` (object):
  - `filters` (object): Faceted filters
  - `sortBy` (string): 'relevance', 'name', 'newest', 'popular', 'views'
  - `limit` (number): Max results

**Returns:**
```javascript
{
    results: [...],        // Array of results
    totalResults: 42,      // Total count
    searchTime: 25,        // Milliseconds
    query: {...},          // Parsed query
    filters: {...}         // Applied filters
}
```

### Autocomplete

```javascript
await advancedSearchSystem.getAutocompleteSuggestions(query, limit)
```

**Returns:** Array of suggestion strings

### Spell Correction

```javascript
advancedSearchSystem.getSpellingSuggestions(query)
```

**Returns:**
```javascript
[
    { original: 'Zues', suggestion: 'Zeus', confidence: 0.87 },
    ...
]
```

### Related Searches

```javascript
advancedSearchSystem.getRelatedSearches(query, limit)
```

**Returns:** Array of related search terms

### Analytics

```javascript
// Popular searches
advancedSearchSystem.getPopularSearches(limit)

// Search trends (last N days)
advancedSearchSystem.getSearchTrends(days)

// Popular entities
advancedSearchSystem.getPopularEntities(limit)
```

### Utility

```javascript
// Refresh index from Firestore
await advancedSearchSystem.refreshIndex()

// Clear cache
advancedSearchSystem.clearCache()

// Get available facets
await advancedSearchSystem.getAvailableFacets()
```

## Filter Options

### Mythologies
```javascript
filters: {
    mythologies: ['greek', 'roman', 'norse', 'egyptian']
}
```

### Content Types
```javascript
filters: {
    contentTypes: ['deity', 'hero', 'creature', 'place']
}
```

### Domains (for deities)
```javascript
filters: {
    domains: ['war', 'love', 'death', 'sky']
}
```

### Tags
```javascript
filters: {
    tags: ['creation', 'underworld', 'trickster']
}
```

### Combined
```javascript
filters: {
    mythologies: ['greek'],
    contentTypes: ['deity'],
    domains: ['war']
}
```

## Sort Options

| Value | Description |
|-------|-------------|
| `'relevance'` | Best match first (default) |
| `'name'` | Alphabetical A-Z |
| `'newest'` | Most recently added |
| `'popular'` | Most voted/liked |
| `'views'` | Most viewed |

## Configuration

```javascript
advancedSearchSystem.config = {
    fuzzyThreshold: 0.7,      // Similarity 0-1
    maxResults: 100,          // Max results
    minQueryLength: 2,        // Min query chars
    cacheTimeout: 300000,     // Cache duration (ms)
    highlightTag: 'mark',     // HTML tag for highlights
    debounceDelay: 300        // Autocomplete delay (ms)
}
```

## Result Object

```javascript
{
    id: 'content_id',
    title: 'Zeus',
    subtitle: 'King of the Gods',
    summary: 'Zeus is the sky and thunder god...',
    contentType: 'deity',
    mythology: 'greek',
    mythologyName: 'Greek Mythology',
    section: 'deities',
    icon: '⚡',
    imageUrl: 'https://...',
    tags: ['olympian', 'sky god'],
    attributes: { domains: ['sky', 'thunder'] },
    searchScore: 42.5,
    matches: [...],
    highlightedTitle: 'Zeus',
    highlightedSummary: '...',
    createdAt: Date,
    views: 150,
    votes: 25
}
```

## Common Patterns

### Search with Filters

```javascript
const results = await advancedSearchSystem.search('war', {
    filters: {
        mythologies: ['greek', 'norse'],
        contentTypes: ['deity']
    },
    sortBy: 'popular',
    limit: 10
});
```

### Autocomplete Input

```javascript
searchInput.addEventListener('input', async (e) => {
    const suggestions = await advancedSearchSystem
        .getAutocompleteSuggestions(e.target.value, 10);
    displaySuggestions(suggestions);
});
```

### Spell Check

```javascript
const results = await advancedSearchSystem.search(query);

if (results.totalResults === 0) {
    const suggestions = advancedSearchSystem.getSpellingSuggestions(query);
    if (suggestions.length > 0) {
        // Show "Did you mean?"
    }
}
```

### Track Entity Views

```javascript
resultCard.addEventListener('click', () => {
    advancedSearchSystem.trackEntityView(result.id, result.title);
});
```

## HTML Integration

### Basic Search Form

```html
<input type="text" id="searchInput" placeholder="Search...">
<button onclick="performSearch()">Search</button>
<div id="results"></div>

<script>
async function performSearch() {
    const query = document.getElementById('searchInput').value;
    const results = await advancedSearchSystem.search(query);
    displayResults(results);
}
</script>
```

### With Autocomplete

```html
<div class="search-container">
    <input type="text" id="searchInput">
    <div id="autocomplete" class="autocomplete-dropdown"></div>
</div>

<script>
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const suggestions = await advancedSearchSystem
            .getAutocompleteSuggestions(e.target.value);
        displayAutocomplete(suggestions);
    }, 300);
});
</script>
```

### With Filters

```html
<div class="filters">
    <label>
        <input type="checkbox" value="greek" onchange="updateFilters()">
        Greek
    </label>
    <!-- More checkboxes -->
</div>

<script>
let currentFilters = { mythologies: [] };

function updateFilters() {
    const checked = Array.from(
        document.querySelectorAll('input:checked')
    ).map(cb => cb.value);

    currentFilters.mythologies = checked;
    performSearch();
}
</script>
```

## Performance Tips

### 1. Cache Results
Results are automatically cached for 5 minutes. No action needed.

### 2. Debounce Autocomplete
Already implemented with 300ms delay.

### 3. Limit Results
```javascript
const results = await search(query, { limit: 20 });
```

### 4. Paginate
```javascript
const page1 = results.results.slice(0, 20);
const page2 = results.results.slice(20, 40);
```

### 5. Refresh Index Periodically
```javascript
setInterval(() => {
    advancedSearchSystem.refreshIndex();
}, 3600000); // Every hour
```

## Troubleshooting

### No Results

```javascript
// Check index size
console.log(advancedSearchSystem.searchIndex.size);

// Rebuild index
await advancedSearchSystem.refreshIndex();

// Check query parsing
const parsed = advancedSearchSystem.parseQuery(query);
console.log(parsed);
```

### Slow Performance

```javascript
// Check search time
const start = performance.now();
const results = await search(query);
console.log('Search took:', performance.now() - start, 'ms');

// Reduce limit
const results = await search(query, { limit: 50 });

// Clear cache
advancedSearchSystem.clearCache();
```

### Autocomplete Not Working

```javascript
// Check minimum length
console.log(advancedSearchSystem.config.minQueryLength);

// Test manually
const suggestions = await advancedSearchSystem
    .getAutocompleteSuggestions('zeu');
console.log(suggestions);
```

## Browser Console Commands

```javascript
// Check system status
advancedSearchSystem.initialized

// View search index
advancedSearchSystem.searchIndex

// View cache
advancedSearchSystem.searchCache

// View analytics
advancedSearchSystem.searchAnalytics

// View history
advancedSearchSystem.searchHistory

// Get config
advancedSearchSystem.config
```

## Files

| File | Purpose |
|------|---------|
| `js/advanced-search.js` | Core search engine |
| `search-advanced.html` | Search interface |
| `css/advanced-search.css` | Styling |
| `SEARCH_IMPLEMENTATION_GUIDE.md` | Full documentation |
| `search-test-examples.html` | Test suite |

## Links

- **Live Search:** [search-advanced.html](search-advanced.html)
- **Test Suite:** [search-test-examples.html](search-test-examples.html)
- **Full Guide:** [SEARCH_IMPLEMENTATION_GUIDE.md](SEARCH_IMPLEMENTATION_GUIDE.md)
- **Home:** [index.html](index.html)

## Support

1. Check browser console for errors
2. Review `SEARCH_IMPLEMENTATION_GUIDE.md`
3. Test with `search-test-examples.html`
4. Verify Firebase connection
5. Check Firestore data

## Version

**Current:** v1.0.0
**Last Updated:** December 15, 2025
**Status:** Production Ready ✅
