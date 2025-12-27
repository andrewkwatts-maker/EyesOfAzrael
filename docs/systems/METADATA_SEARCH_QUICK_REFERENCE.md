# Metadata Search - Quick Reference

## 1-Minute Setup

```javascript
// Include scripts
<script src="corpus-search-core.js"></script>
<script src="js/alternate-name-index.js"></script>
<script src="js/corpus-metadata-integration.js"></script>

// Initialize
const corpusSearch = new CorpusSearch('config.json');
await corpusSearch.init();
await corpusSearch.enableMetadataIntegration();

// Search
const results = await corpusSearch.search('Enki', { useMetadata: true });
```

## Common Use Cases

### Search with Metadata
```javascript
const results = await corpusSearch.search('Zeus', { useMetadata: true });
// Finds: Zeus, Jupiter, Jove
```

### Get Alternate Suggestions
```javascript
const integration = corpusSearch.getMetadataIntegration();
const suggestions = integration.getAlternateSuggestions('Enki');
// Returns: [{term: 'Ea', type: 'alternate'}, ...]
```

### Custom Entity Data
```javascript
const entities = [/* your entities */];
const index = new AlternateNameIndex();
index.loadFromArray(entities);

const integration = new CorpusMetadataIntegration(corpusSearch);
await integration.init({ nameIndexInstance: index });
```

### Disable Metadata
```javascript
// Temporarily disable
const results = await corpusSearch.search('term', { useMetadata: false });

// Or in integration
integration.setAutoExpand(false);
integration.setCrossCultural(false);
```

## Entity Metadata Format

```json
{
  "id": "enki",
  "name": "Enki",
  "type": "deity",
  "mythologies": ["sumerian"],
  "linguistic": {
    "alternativeNames": [
      { "name": "Ea", "language": "akkadian" }
    ]
  },
  "mythologyContexts": [
    { "mythology": "sumerian", "names": ["Enki", "Nudimmud"] }
  ]
}
```

## Cross-Cultural Mapping Format

```json
{
  "deityEquivalents": [
    {
      "id": "zeus-jupiter",
      "names": ["Zeus", "Jupiter", "Jove"],
      "mythologies": ["greek", "roman"],
      "confidence": "high"
    }
  ]
}
```

## API Cheat Sheet

| Task | Code |
|------|------|
| Enable metadata | `await corpusSearch.enableMetadataIntegration()` |
| Search with metadata | `corpusSearch.search(term, {useMetadata: true})` |
| Get suggestions | `integration.getAlternateSuggestions(term)` |
| Find entity | `integration.getEntityByName(name)` |
| Expand terms | `index.expandSearchTerms(term, {maxAlternates: 5})` |
| Get stats | `integration.getStats()` |
| Check availability | `corpusSearch.hasMetadataIntegration()` |

## Testing

```bash
# Open demo page
open test-metadata-search.html

# Test scenarios:
# 1. Search "Enki" → finds "Ea"
# 2. Search "Zeus" → finds "Jupiter"
# 3. Search "Marduk" → finds "Bel"
```

## Performance

- Index building: ~100-500ms for 100 entities
- Search overhead: < 10ms
- Memory: ~1-2MB for 100 entities

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No metadata | Check if libraries loaded: `typeof AlternateNameIndex !== 'undefined'` |
| No alternates | Verify entity has `linguistic.alternativeNames` |
| No cross-cultural | Check `cross-cultural-mapping.json` loaded |
| Slow performance | Reduce `maxAlternates` or disable for large datasets |

## Files

- **Core:** `js/alternate-name-index.js`, `js/corpus-metadata-integration.js`
- **Data:** `data/cross-cultural-mapping.json`, `data/entities/**/*.json`
- **UI:** `corpus-search-ui.js` (auto-integrates)
- **Test:** `test-metadata-search.html`
- **Docs:** `METADATA_SEARCH_GUIDE.md`

## Support

See `METADATA_SEARCH_GUIDE.md` for full documentation.
