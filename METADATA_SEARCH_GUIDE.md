# Metadata-Enhanced Corpus Search Guide

## Overview

The metadata integration system enhances corpus search by expanding queries with alternate names, cross-cultural equivalents, and entity metadata. This allows searches to find results across different naming conventions, languages, and mythological traditions.

## Features

### 1. Alternate Name Expansion
Automatically expands search queries to include all known variants of entity names:
- **Example:** Searching "Enki" also finds "Ea" and "Nudimmud"
- **Source:** Entity metadata files in `/data/entities/`

### 2. Cross-Cultural Equivalents
Finds equivalent deities and concepts across different mythologies:
- **Example:** Searching "Zeus" also finds "Jupiter" references
- **Source:** `/data/cross-cultural-mapping.json`

### 3. Entity Metadata Enrichment
Results are annotated with entity information:
- Primary name and alternate names
- Mythology/cultural context
- Entity type (deity, creature, place, etc.)
- Related cross-cultural equivalents

## Quick Start

### Basic Usage

Include the required JavaScript files in your HTML:

```html
<!-- Core corpus search -->
<script src="corpus-search-core.js"></script>

<!-- Metadata integration -->
<script src="js/alternate-name-index.js"></script>
<script src="js/corpus-metadata-integration.js"></script>
```

Initialize and use:

```javascript
// Initialize corpus search
const corpusSearch = new CorpusSearch('corpus-config.json');
await corpusSearch.init();

// Enable metadata integration
const metadataIntegration = await corpusSearch.enableMetadataIntegration({
    loadCrossCulturalMap: true
});

// Search with metadata enhancement
const results = await corpusSearch.search('Enki', {
    useMetadata: true  // Enable metadata-enhanced search
});
```

### Using Existing UI

If you're using `corpus-search-ui.js`, metadata integration is automatically enabled. Users can toggle it with a checkbox in the search interface.

## Architecture

### Component Overview

```
┌─────────────────────────────────────┐
│   Corpus Search Core                │
│   (corpus-search-core.js)           │
└──────────────┬──────────────────────┘
               │
               ├──> Standard Search (existing)
               │
               └──> Metadata-Enhanced Search
                    │
                    ├──> AlternateNameIndex
                    │    (js/alternate-name-index.js)
                    │    - Loads entity metadata
                    │    - Indexes all name variants
                    │    - Fast lookup by any name
                    │
                    └──> CorpusMetadataIntegration
                         (js/corpus-metadata-integration.js)
                         - Expands search terms
                         - Annotates results
                         - Cross-cultural mapping
```

### Data Flow

1. **User enters search term** (e.g., "Enki")
2. **AlternateNameIndex** finds entity and all variants
3. **Cross-cultural mapping** adds equivalents
4. **Expanded search** runs with all terms: ["Enki", "Ea", "Nudimmud"]
5. **Results annotated** with entity metadata
6. **UI displays** enhanced results

## API Reference

### AlternateNameIndex

```javascript
const index = new AlternateNameIndex();

// Load from entity array
index.loadFromArray(entities);

// Find entities by name
const matches = index.findEntitiesByName('Enki', {
    exactMatch: false,
    mythology: 'sumerian',
    entityType: 'deity',
    limit: 10
});

// Get all alternates for an entity
const alternates = index.getAlternateNames('enki');

// Expand search terms
const expanded = index.expandSearchTerms('Enki', {
    includePartialMatches: false,
    maxAlternates: 5
});

// Get statistics
const stats = index.getStats();
```

### CorpusMetadataIntegration

```javascript
const integration = new CorpusMetadataIntegration(corpusSearch);
await integration.init();

// Search with metadata
const results = await integration.searchWithMetadata('Enki', {
    caseSensitive: false,
    maxResults: 100,
    expandNames: true,
    includeCrossCultural: true,
    annotate: true
});

// Get alternate suggestions
const suggestions = integration.getAlternateSuggestions('Enki', {
    limit: 5,
    includeCrossCultural: true
});

// Get entity info
const entity = integration.getEntityByName('Enki');

// Check availability
const available = integration.isMetadataAvailable();

// Get statistics
const stats = integration.getStats();
```

### CorpusSearch (Enhanced)

```javascript
const corpusSearch = new CorpusSearch('config.json');
await corpusSearch.init();

// Enable metadata integration
await corpusSearch.enableMetadataIntegration({
    loadCrossCulturalMap: true
});

// Search (standard)
const standardResults = await corpusSearch.search('Enki');

// Search (metadata-enhanced)
const enhancedResults = await corpusSearch.search('Enki', {
    useMetadata: true
});

// Check if metadata available
const hasMetadata = corpusSearch.hasMetadataIntegration();
```

## Adding Entity Mappings

### Entity Metadata Files

Entity files should follow the schema in `/data/schemas/entity-schema-v2.json`:

```json
{
  "id": "enki",
  "type": "deity",
  "name": "Enki",
  "mythologies": ["sumerian", "akkadian"],
  "primaryMythology": "sumerian",
  "linguistic": {
    "originalName": "𒀭𒂗𒆠",
    "alternativeNames": [
      {
        "name": "Ea",
        "language": "akkadian",
        "context": "Akkadian equivalent"
      },
      {
        "name": "Nudimmud",
        "language": "sumerian",
        "context": "Epithet meaning 'creator'"
      }
    ]
  },
  "mythologyContexts": [
    {
      "mythology": "sumerian",
      "names": ["Enki", "Nudimmud"]
    },
    {
      "mythology": "akkadian",
      "names": ["Ea"]
    }
  ]
}
```

### Cross-Cultural Mappings

Edit `/data/cross-cultural-mapping.json`:

```json
{
  "deityEquivalents": [
    {
      "id": "enki-ea",
      "category": "wisdom-water-god",
      "names": ["Enki", "Ea", "Nudimmud"],
      "mythologies": ["sumerian", "akkadian", "babylonian"],
      "description": "God of water, wisdom, and creation",
      "confidence": "high"
    }
  ]
}
```

**Confidence Levels:**
- `high`: Direct equivalents, widely accepted by scholars
- `medium`: Partial equivalents, similar functions but different contexts
- `low`: Loose associations, thematic similarities

## Testing

### Demo Page

Open `test-metadata-search.html` in your browser to:
- Test alternate name expansion
- Verify cross-cultural mappings
- See before/after comparisons
- Run automated tests

### Manual Testing

```javascript
// Test 1: Alternate names
const results1 = await integration.searchWithMetadata('Enki');
// Should find: Enki, Ea, Nudimmud

// Test 2: Cross-cultural
const results2 = await integration.searchWithMetadata('Zeus');
// Should find: Zeus, Jupiter, Jove

// Test 3: No metadata (graceful fallback)
const results3 = await integration.searchWithMetadata('unknownterm');
// Should work normally without enhancement
```

### Test Scenarios

| Scenario | Input | Expected Output |
|----------|-------|----------------|
| Alternate names | "Enki" | Finds "Ea", "Nudimmud" |
| Cross-cultural | "Zeus" | Finds "Jupiter" |
| Epithets | "Marduk" | Finds "Bel" |
| Sanskrit variations | "Brahma" | Finds "Pitamaha", "Svayambhu" |
| No metadata | "randomterm" | Works normally |
| No alternates | Entity with no alternates | Works normally |

## Performance Considerations

### Index Building

- **Initial Load:** ~100-500ms for 100 entities
- **Memory:** ~1-2MB for 100 entities with full metadata
- **Caching:** Index is built once per session

### Search Performance

- **Name Lookup:** O(1) average, O(n) worst case
- **Query Expansion:** Negligible overhead (< 10ms)
- **Result Annotation:** ~1-2ms per result

### Optimization Tips

1. **Limit Entity Loading:**
   ```javascript
   await index.loadFromDirectory('/data/entities', {
       entityTypes: ['deity', 'creature']  // Load only needed types
   });
   ```

2. **Control Expansion:**
   ```javascript
   const results = await integration.searchWithMetadata(term, {
       expandNames: true,
       maxAlternates: 3  // Limit expanded terms
   });
   ```

3. **Disable When Not Needed:**
   ```javascript
   const results = await corpusSearch.search(term, {
       useMetadata: false  // Skip metadata enhancement
   });
   ```

## Backward Compatibility

### Graceful Degradation

The system is designed to work seamlessly with or without metadata:

```javascript
// Without metadata libraries loaded - works normally
const results1 = await corpusSearch.search('term');

// With metadata but disabled - works normally
const results2 = await corpusSearch.search('term', { useMetadata: false });

// With metadata enabled - enhanced results
const results3 = await corpusSearch.search('term', { useMetadata: true });
```

### Legacy Support

All existing corpus search functionality remains unchanged:
- Standard search works as before
- No breaking changes to API
- Metadata is additive, not required

## Troubleshooting

### Common Issues

**Issue:** Metadata integration not initializing
```javascript
// Check if libraries are loaded
if (typeof AlternateNameIndex === 'undefined') {
    console.error('AlternateNameIndex not loaded');
}
```

**Issue:** No alternate names found
```javascript
// Check entity data
const entity = integration.getEntityByName('Enki');
console.log(entity);  // Should show entity metadata

// Check index stats
const stats = integration.getStats();
console.log(stats);  // Should show indexed entities
```

**Issue:** Cross-cultural mapping not working
```javascript
// Verify mapping file loaded
const stats = integration.getStats();
console.log(stats.crossCulturalMapLoaded);  // Should be true
```

## Examples

### Example 1: Simple Integration

```javascript
// Initialize
const corpusSearch = new CorpusSearch('corpus-config.json');
await corpusSearch.init();
await corpusSearch.enableMetadataIntegration();

// Search
const results = await corpusSearch.search('Enki', { useMetadata: true });

// Display
results.forEach(result => {
    console.log(result.text_name);
    if (result.metadata?.entityAnnotation) {
        const annotation = result.metadata.entityAnnotation;
        console.log('  Matched:', annotation.matchedTerm);
        console.log('  Entity:', annotation.entityMetadata?.primaryName);
    }
});
```

### Example 2: Custom Entity Data

```javascript
const entities = [
    {
        id: 'zeus',
        type: 'deity',
        name: 'Zeus',
        mythologies: ['greek'],
        linguistic: {
            alternativeNames: [
                { name: 'Jupiter', language: 'latin' }
            ]
        }
    }
];

const index = new AlternateNameIndex();
index.loadFromArray(entities);

const integration = new CorpusMetadataIntegration(corpusSearch);
await integration.init({ nameIndexInstance: index });
```

### Example 3: Suggestions Only

```javascript
// Get alternate name suggestions without searching
const suggestions = integration.getAlternateSuggestions('Enki');

suggestions.forEach(sug => {
    console.log(`${sug.term} (${sug.type})`);
});

// Output:
// Ea (alternate)
// Nudimmud (alternate)
```

## Future Enhancements

Potential improvements for future versions:

1. **Fuzzy Matching:** Handle spelling variations and typos
2. **Phonetic Search:** Match names by pronunciation
3. **Semantic Search:** Find related concepts beyond exact equivalents
4. **Entity Disambiguation:** Handle multiple entities with same name
5. **Machine Learning:** Auto-generate cross-cultural mappings
6. **Relationship Graphs:** Visualize entity connections
7. **Historical Timeline:** Search by time period

## Contributing

To add new entity mappings:

1. Create/update entity file in `/data/entities/[type]/`
2. Follow schema in `/data/schemas/entity-schema-v2.json`
3. Include alternate names in `linguistic.alternativeNames`
4. Add cross-cultural equivalents to `/data/cross-cultural-mapping.json`
5. Test with `test-metadata-search.html`

## License

Part of Eyes of Azrael project. See main README for license information.

## Support

For issues or questions:
- Check troubleshooting section above
- Review test page for examples
- Consult API reference
- Contact project maintainer
