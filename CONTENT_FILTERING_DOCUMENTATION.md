# Content Filtering System Documentation

## Overview

The Content Filtering System allows users to control whether they see community-contributed content alongside official (standard) content. By default, only official content is shown, ensuring quality and accuracy for new users. Users can opt-in to view community content through a toggle switch.

---

## Architecture

### Components

1. **User Preferences Service** (`js/services/user-preferences-service.js`)
   - Manages user preferences for content filtering
   - Syncs between Firestore (authenticated) and localStorage (anonymous)
   - Default: `showUserContent: false`

2. **Asset Service** (`js/services/asset-service.js`)
   - Handles querying standard and community assets from Firebase
   - Merges and marks assets by source (standard vs community)
   - Caches results to minimize Firebase reads

3. **Content Filter Component** (`js/components/content-filter.js`)
   - Toggle UI for showing/hiding community content
   - Displays count of available community items
   - Info modal explaining community content
   - Real-time query updates when toggled

4. **Content Filter UI** (`components/content-filter-toggle.html`)
   - Toggle switch component
   - Community content info modal
   - Loading states

5. **Browse Category View Integration**
   - Integrated into `js/views/browse-category-view.js`
   - Reloads entities when filter changes
   - Displays "Community" badges on user-contributed content

---

## User Experience

### Default Behavior

- **New Users**: See only standard (official) content
- **Preference**: Stored in `user_preferences/{userId}/contentFilters/showUserContent`
- **Anonymous Users**: Preference stored in `localStorage`

### Toggle Interaction

1. User clicks toggle switch
2. Preference is saved to Firestore (authenticated) or localStorage (anonymous)
3. Browse view re-queries Firebase with updated filter
4. Grid updates with new content
5. Statistics update to reflect new count

### Visual Indicators

- **Community Badge**: Blue "Community" badge in top-right corner of card
- **Border Indicator**: Left border accent on community content cards
- **Tooltip**: Hovering shows contributor username
- **Count Badge**: Shows "+X items" when community content is available

---

## Data Model

### Firestore Structure

#### User Preferences
```javascript
user_preferences/{userId}
├── contentFilters
│   ├── showUserContent: false (default)
│   ├── showTheories: true
│   ├── showSubmissions: true
│   ├── showApprovedOnly: false
│   ├── hideControversial: false
│   └── minVoteScore: -10
├── displayPreferences
│   └── ...
└── updatedAt: timestamp
```

#### Standard Assets
```javascript
{category} (e.g., deities, heroes, creatures)
└── {docId}
    ├── id: string
    ├── name: string
    ├── mythology: string
    ├── description: string
    ├── ... (category-specific fields)
```

#### User Assets
```javascript
user_assets/{userId}/{category}/{docId}
├── id: string
├── name: string
├── mythology: string
├── description: string
├── isPublic: boolean
├── authorId: string
├── contributedBy: string
├── createdAt: timestamp
├── ... (category-specific fields)
```

---

## Query Logic

### Standard Content Only (Default)

```javascript
const assets = await assetService.getAssets('deities', {
  mythology: 'greek',
  includeUserContent: false
});

// Returns only standard assets from {category} collection
```

### Standard + Community Content

```javascript
const assets = await assetService.getAssets('deities', {
  mythology: 'greek',
  includeUserContent: true
});

// Returns:
// 1. Standard assets from {category} collection
// 2. User assets from collectionGroup query
// 3. Merged, sorted, and marked by source
```

### Merged Asset Structure

```javascript
{
  id: string,
  name: string,
  mythology: string,
  description: string,
  isStandard: boolean,    // true = official, false = community
  source: "standard" | "community",
  userId?: string,        // Only for community content
  ... (other fields)
}
```

---

## API Reference

### UserPreferencesService

```javascript
import { UserPreferencesService } from './user-preferences-service.js';

const prefs = new UserPreferencesService();
await prefs.init();

// Get preference
const showUserContent = prefs.shouldShowUserContent();

// Set preference
await prefs.setShowUserContent(true);

// Get all content filters
const filters = prefs.getContentFilters();
```

### AssetService

```javascript
import { AssetService } from './asset-service.js';

const service = new AssetService();

// Get assets with options
const assets = await service.getAssets('deities', {
  mythology: 'greek',           // Optional: Filter by mythology
  includeUserContent: false,    // Default: false
  orderBy: 'name',              // 'name' or 'dateAdded'
  limit: 500                    // Max results
});

// Get user asset count
const count = await service.getUserAssetCount('deities', 'greek');

// Get single asset
const asset = await service.getAsset('deities', 'zeus', {
  checkUserAssets: true
});

// Clear cache
service.clearCache();
```

### ContentFilter

```javascript
import { ContentFilter } from './content-filter.js';

const filter = new ContentFilter({
  container: document.getElementById('filterContainer'),
  category: 'deities',
  mythology: 'greek',
  onToggle: async (showUserContent) => {
    // Handle toggle change
    await reloadContent(showUserContent);
  }
});

// Get state
const state = filter.getState();

// Refresh count
await filter.refreshCount();

// Destroy
filter.destroy();
```

---

## Implementation Guide

### Adding to a Browse View

1. **Include Required Scripts**

```html
<!-- Component templates -->
<link rel="import" href="/components/content-filter-toggle.html" />

<!-- Styles -->
<link rel="stylesheet" href="/css/content-filter.css" />

<!-- JavaScript modules -->
<script src="/js/services/user-preferences-service.js"></script>
<script src="/js/services/asset-service.js"></script>
<script src="/js/components/content-filter.js"></script>
```

2. **Add Container to HTML**

```html
<div class="browse-view">
  <header class="browse-header">...</header>

  <!-- Content filter container -->
  <div id="contentFilterContainer"></div>

  <div class="entity-grid">...</div>
</div>
```

3. **Initialize in JavaScript**

```javascript
class MyBrowseView {
  async render(container, options) {
    // Load entities using AssetService
    const assetService = new AssetService();
    const prefsService = new UserPreferencesService();
    await prefsService.init();

    const showUserContent = prefsService.shouldShowUserContent();

    this.entities = await assetService.getAssets('deities', {
      mythology: options.mythology,
      includeUserContent: showUserContent
    });

    // Render HTML
    container.innerHTML = this.getHTML();

    // Initialize content filter
    const filter = new ContentFilter({
      container: document.getElementById('contentFilterContainer'),
      category: 'deities',
      mythology: options.mythology,
      onToggle: async (showUserContent) => {
        await this.reloadEntities(showUserContent);
      }
    });
  }

  async reloadEntities(showUserContent) {
    this.entities = await this.assetService.getAssets('deities', {
      mythology: this.mythology,
      includeUserContent: showUserContent
    });

    this.updateGrid();
  }
}
```

---

## Performance Optimization

### Caching Strategy

1. **AssetService Cache**
   - Caches query results for 5 minutes
   - Separate cache keys for different query parameters
   - Clear cache when toggling filter

2. **Community Count Cache**
   - Cached for 5 minutes in ContentFilter
   - Reduces redundant count queries
   - Refreshable on demand

3. **User Preferences Cache**
   - Cached in UserPreferences class (5 minutes)
   - Minimizes Firestore reads
   - Auto-invalidates on save

### Query Optimization

- **Standard Content**: Direct collection query (fast)
- **Community Content**: collectionGroup query (indexed)
- **Merged Results**: Client-side merge and sort

### Best Practices

1. **Minimize Re-queries**
   - Cache results aggressively
   - Only re-query when filter changes
   - Use Firebase composite indexes

2. **Efficient Rendering**
   - Update only affected cards
   - Use virtual scrolling for large lists
   - Debounce filter changes

3. **Loading States**
   - Show loading indicator during re-query
   - Maintain scroll position
   - Disable toggle during load

---

## Security Rules

### Firestore Security Rules

```javascript
// User preferences - users can only read/write their own
match /user_preferences/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Standard assets - read-only for all
match /{category}/{docId} {
  allow read: if true;
  allow write: if false; // Admin only
}

// User assets - read public, write own
match /user_assets/{userId}/{category}/{docId} {
  allow read: if resource.data.isPublic == true;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Troubleshooting

### Toggle Not Working

1. Check console for errors
2. Verify Firebase authentication
3. Ensure Firestore security rules allow access
4. Check `contentFilters.showUserContent` in user preferences

### Community Content Not Showing

1. Verify `isPublic: true` on user assets
2. Check collectionGroup indexes in Firebase console
3. Ensure mythology filter matches
4. Verify AssetService query logic

### Count Badge Not Updating

1. Clear count cache: `filter.refreshCount()`
2. Check collectionGroup query permissions
3. Verify community assets exist with correct mythology

### Performance Issues

1. Enable Firebase composite indexes
2. Reduce query limit
3. Implement pagination
4. Cache query results longer

---

## Future Enhancements

### Planned Features

1. **Advanced Filtering**
   - Filter by vote score
   - Filter by contributor reputation
   - Filter by verification status

2. **Sorting Options**
   - Sort by community votes
   - Sort by contributor
   - Sort by last updated

3. **Badges & Indicators**
   - "Verified" badge for reviewed content
   - "Popular" badge for high-voted content
   - "New" badge for recent submissions

4. **Analytics**
   - Track toggle usage
   - Monitor community content views
   - Report quality metrics

---

## Related Documentation

- [User Preferences System](./USER_PREFERENCES_DOCUMENTATION.md)
- [Asset Management Guide](./ASSET_MANAGEMENT_GUIDE.md)
- [Browse Views Documentation](./BROWSE_VIEWS_DOCUMENTATION.md)
- [Firebase Integration Guide](./FIREBASE_INTEGRATION_GUIDE.md)

---

## Support

For questions or issues:
- Check console logs for errors
- Review Firestore security rules
- Verify Firebase indexes
- Test with both authenticated and anonymous users

---

**Last Updated**: 2025-12-29
**Version**: 1.0.0
**Status**: Production Ready
