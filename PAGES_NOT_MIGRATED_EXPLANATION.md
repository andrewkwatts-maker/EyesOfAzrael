# Pages Not Migrated - Explanation

## Summary
Out of 100 pages processed, 46 were intentionally skipped because they are not entity detail pages. This is the correct and expected behavior.

## Categories of Skipped Pages

### 1. Corpus Search Pages (5 pages)
These are search/index pages, not individual entity pages:
- mythos/apocryphal/cosmology-map.html
- mythos/babylonian/corpus-search.html
- mythos/buddhist/corpus-search.html
- mythos/chinese/corpus-search.html
- mythos/christian/corpus-search.html

**Why skipped:** These are utility/search pages, not entity detail pages

### 2. Gnostic Teaching/Concept Pages (23 pages)
These pages describe theological concepts and teachings, not entities:
- mythos/christian/gnostic/aeons.html
- mythos/christian/gnostic/beatitudes-gnosis.html
- mythos/christian/gnostic/christ-savior.html
- mythos/christian/gnostic/daniels-kingdom.html
- mythos/christian/gnostic/divine-pursuit.html
- mythos/christian/gnostic/feminine-divine.html
- mythos/christian/gnostic/god-is-spirit.html
- mythos/christian/gnostic/gods-infinite-love.html
- mythos/christian/gnostic/grace-not-works.html
- mythos/christian/gnostic/irresistible-love.html
- mythos/christian/gnostic/judge-not.html
- mythos/christian/gnostic/kingdom-within.html
- mythos/christian/gnostic/lost-sheep.html
- mythos/christian/gnostic/love-enemies.html
- mythos/christian/gnostic/monad.html
- mythos/christian/gnostic/prodigal-son.html
- mythos/christian/gnostic/redemption-all.html
- mythos/christian/gnostic/refining-fire.html
- mythos/christian/gnostic/sermon-on-mount.html
- mythos/christian/gnostic/sophia-redemption.html
- mythos/christian/gnostic/sophia.html
- mythos/christian/gnostic/universal-salvation/all-souls-saved.html
- mythos/christian/gnostic/universal-salvation/apokatastasis-doctrine.html
- mythos/christian/gnostic/universal-salvation/divine-love-wins.html
- mythos/christian/gnostic/universal-salvation/inclusion-gentiles.html
- mythos/christian/gnostic/universal-salvation/no-eternal-hell.html

**Why skipped:** These are conceptual/teaching pages, not entity detail pages. They belong in a different content structure (possibly "concepts" or "teachings" collections).

### 3. Lineage/Genealogy Pages (7 pages)
These pages track family trees and lineages, not individual entities:
- mythos/christian/lineage/ancestors/abraham.html
- mythos/christian/lineage/ancestors/david.html
- mythos/christian/lineage/davidic-line.html
- mythos/christian/lineage/key-ancestors.html
- mythos/christian/lineage/luke-genealogy.html
- mythos/christian/lineage/matthew-genealogy.html
- mythos/christian/lineage/women-in-lineage.html

**Why skipped:** These are relational/organizational pages, not entity detail pages

### 4. Resource Pages (1 page)
Reference material pages:
- mythos/christian/resources/tim-ward-biblical-studies.html

**Why skipped:** This is a resource/reference page, not an entity

### 5. Teaching/Parable Pages (4 pages)
Pages describing teachings and parables:
- mythos/christian/teachings/parables/mustard-seed.html
- mythos/christian/teachings/sermon-on-mount/beatitudes-overview.html
- mythos/christian/teachings/sermon-on-mount/blessed-mourn.html
- mythos/christian/teachings/sermon-on-mount/blessed-poor-in-spirit.html
- mythos/christian/teachings/sermon-on-mount/impossible-standard.html

**Why skipped:** These are teaching content pages, not entity detail pages

### 6. Apocryphal Special Pages (3 pages)
Specialized content pages:
- mythos/apocryphal/enoch-visualizations.html
- mythos/apocryphal/temple-mysteries.html

**Why skipped:** These are special content pages, not entity detail pages

## Migration Logic

The migration script correctly identifies entity pages by looking for this path structure:
```
mythos/[mythology]/[entity-type]/[entity-name].html
```

Where `[entity-type]` must be one of:
- deities
- heroes
- creatures
- cosmology
- rituals
- texts
- symbols
- herbs

Pages that don't match this structure are correctly skipped.

## Recommendations for Skipped Pages

### Gnostic Teaching Pages
These could benefit from a different migration approach:
- Create a "concepts" or "teachings" collection in Firestore
- Use a different loader script (concepts-loader.js)
- Group by theme rather than mythology

### Lineage Pages
Consider:
- Creating a separate "lineages" collection
- Using a specialized visualization component
- Could be enhanced with dynamic family tree rendering

### Search/Index Pages
These are working correctly as-is and don't need Firebase migration

### Resource Pages
These could be:
- Left as static pages
- Migrated to a "resources" collection if more are added
- Enhanced with tagging/search functionality

## Conclusion

All 46 skipped pages were correctly identified as non-entity pages. The migration script worked exactly as designed, successfully migrating only the appropriate entity detail pages while preserving other page types.
