# Content Filter Quick Start Guide

## TL;DR

The content filtering system lets users toggle between viewing only official content (default) or including community contributions. It's fully integrated into browse views with automatic preference persistence.

---

## 5-Minute Integration

### Step 1: Include Required Files

Add to your HTML `<head>`:

```html
<!-- Templates -->
<link rel="import" href="/components/content-filter-toggle.html" />

<!-- Styles -->
<link rel="stylesheet" href="/css/content-filter.css" />

<!-- Scripts (in order) -->
<script src="/js/user-preferences.js"></script>
<script src="/js/services/user-preferences-service.js"></script>
<script src="/js/services/asset-service.js"></script>
<script src="/js/components/content-filter.js"></script>
```

### Step 2: Add Container to View

```html
<div class="browse-view">
  <header>...</header>

  <!-- Add this container -->
  <div id="contentFilterContainer"></div>

  <div class="entity-grid">...</div>
</div>
```

### Step 3: Initialize in JavaScript

```javascript
class MyView {
  constructor() {
    this.assetService = new AssetService();
    this.contentFilter = null;
  }

  async render(container, options) {
    // Load assets with user preference
    const prefsService = new UserPreferencesService();
    await prefsService.init();
    const showUserContent = prefsService.shouldShowUserContent();

    this.entities = await this.assetService.getAssets(options.category, {
      mythology: options.mythology,
      includeUserContent: showUserContent
    });

    // Render HTML
    container.innerHTML = this.getHTML();

    // Initialize filter
    this.contentFilter = new ContentFilter({
      container: document.getElementById('contentFilterContainer'),
      category: options.category,
      mythology: options.mythology,
      onToggle: async (show) => await this.reload(show)
    });
  }

  async reload(showUserContent) {
    this.entities = await this.assetService.getAssets(this.category, {
      mythology: this.mythology,
      includeUserContent: showUserContent
    });
    this.updateGrid();
  }
}
```

### Step 4: Add Community Badge to Entity Cards

```javascript
getEntityCardHTML(entity) {
  const badge = entity.isStandard ? '' :
    `<span class="user-content-badge" title="Created by ${entity.userId}">Community</span>`;

  return `
    <div class="entity-card ${entity.isStandard ? '' : 'entity-card-community'}">
      ${badge}
      <h3>${entity.name}</h3>
      <p>${entity.description}</p>
    </div>
  `;
}
```

**Done!** Your view now has content filtering.

---

## Key Concepts

### Default Behavior

- **OFF by default**: Only official content shows
- **Authenticated users**: Preference stored in Firestore
- **Anonymous users**: Preference stored in localStorage
- **Auto-sync**: localStorage syncs to Firestore on login

### Asset Structure

```javascript
// Standard asset
{
  id: 'zeus',
  name: 'Zeus',
  isStandard: true,
  source: 'standard'
}

// Community asset
{
  id: 'custom-deity',
  name: 'Custom Deity',
  isStandard: false,
  source: 'community',
  userId: 'user123'
}
```

### UI Components

1. **Toggle Switch**: Blue when ON, gray when OFF
2. **Count Badge**: Shows "+X items" when community content available
3. **Info Button**: Opens modal explaining community content
4. **Loading State**: Grays out during re-query

---

## Common Patterns

### Check if Content Filter is Enabled

```javascript
const prefsService = new UserPreferencesService();
await prefsService.init();
const enabled = prefsService.shouldShowUserContent();
```

### Get Assets with Filter

```javascript
const assetService = new AssetService();
const assets = await assetService.getAssets('deities', {
  mythology: 'greek',
  includeUserContent: true // or false
});
```

### Get Community Content Count

```javascript
const count = await assetService.getUserAssetCount('deities', 'greek');
console.log(`${count} community items available`);
```

### Save Preference

```javascript
const prefsService = new UserPreferencesService();
await prefsService.init();
await prefsService.setShowUserContent(true);
```

---

## Styling

### Badge CSS (already included)

```css
.user-content-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  border-radius: 9999px;
}

.entity-card-community {
  border-left: 3px solid var(--color-secondary);
}
```

### Custom Toggle Position

```css
#contentFilterContainer {
  margin-bottom: 2rem; /* Adjust spacing */
}
```

---

## Firestore Setup

### Security Rules

Add to `firestore.rules`:

```javascript
// User preferences
match /user_preferences/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// User assets - public read only
match /user_assets/{userId}/{category}/{docId} {
  allow read: if resource.data.isPublic == true;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### Composite Indexes

Create in Firebase Console:
- Collection: `user_assets/{userId}/deities`
- Fields: `mythology` (Ascending), `isPublic` (Ascending)

Repeat for each category: `heroes`, `creatures`, `items`, etc.

---

## Troubleshooting

### Toggle not appearing?

```javascript
// Check if template loaded
const template = document.getElementById('content-filter-toggle-template');
console.log('Template loaded:', !!template);

// Check if container exists
const container = document.getElementById('contentFilterContainer');
console.log('Container exists:', !!container);
```

### Community content not showing?

```javascript
// Check preference
const prefsService = new UserPreferencesService();
await prefsService.init();
console.log('Show user content:', prefsService.shouldShowUserContent());

// Check assets
const assets = await assetService.getAssets('deities', { includeUserContent: true });
console.log('Community assets:', assets.filter(a => !a.isStandard).length);
```

### Count badge not updating?

```javascript
// Refresh count manually
await contentFilter.refreshCount();
```

---

## Advanced Usage

### Custom onToggle Handler

```javascript
new ContentFilter({
  container: document.getElementById('contentFilterContainer'),
  category: 'deities',
  onToggle: async (showUserContent) => {
    console.log('Filter toggled:', showUserContent);

    // Custom loading UI
    showLoadingSpinner();

    // Reload with custom logic
    await this.customReload(showUserContent);

    // Update custom UI
    this.updateCustomStats();

    hideLoadingSpinner();
  }
});
```

### Programmatic Toggle

```javascript
// Get current state
const state = contentFilter.getState();
console.log('Current:', state.showUserContent);

// Toggle programmatically
const toggle = document.getElementById('show-community-content');
toggle.checked = !toggle.checked;
toggle.dispatchEvent(new Event('change'));
```

### Listen for Changes

```javascript
window.addEventListener('contentFilterChanged', (e) => {
  console.log('Filter changed:', e.detail.showUserContent);
  console.log('Category:', e.detail.category);
  console.log('Mythology:', e.detail.mythology);
});
```

---

## Performance Tips

1. **Cache aggressively**: AssetService caches for 5 minutes
2. **Debounce toggles**: Prevent rapid toggling
3. **Virtual scrolling**: For 100+ items
4. **Lazy load badges**: Only render visible cards

---

## FAQs

**Q: Can users see their own unpublished content?**
A: No, only assets with `isPublic: true` are shown.

**Q: How do I hide the toggle?**
A: Don't render the `#contentFilterContainer` div.

**Q: Can I customize the badge text?**
A: Yes, edit `getEntityCardHTML()` in your view.

**Q: Does this work offline?**
A: Preferences persist (localStorage), but queries require connectivity.

**Q: Can I pre-load the toggle state?**
A: Yes, await `prefsService.init()` before rendering.

---

## Example: Minimal Implementation

```javascript
// Complete minimal example
class MinimalBrowseView {
  async render(container, category, mythology) {
    // Setup
    this.assetService = new AssetService();
    this.category = category;
    this.mythology = mythology;

    // Get preference
    const prefs = new UserPreferencesService();
    await prefs.init();
    const show = prefs.shouldShowUserContent();

    // Load assets
    this.entities = await this.assetService.getAssets(category, {
      mythology,
      includeUserContent: show
    });

    // Render
    container.innerHTML = `
      <div id="contentFilterContainer"></div>
      <div class="grid">${this.renderCards()}</div>
    `;

    // Init filter
    new ContentFilter({
      container: document.getElementById('contentFilterContainer'),
      category,
      mythology,
      onToggle: async (show) => {
        this.entities = await this.assetService.getAssets(category, {
          mythology,
          includeUserContent: show
        });
        document.querySelector('.grid').innerHTML = this.renderCards();
      }
    });
  }

  renderCards() {
    return this.entities.map(e => `
      <div class="card ${e.isStandard ? '' : 'entity-card-community'}">
        ${e.isStandard ? '' : '<span class="user-content-badge">Community</span>'}
        <h3>${e.name}</h3>
      </div>
    `).join('');
  }
}
```

---

## Resources

- **Full Documentation**: `CONTENT_FILTERING_DOCUMENTATION.md`
- **Implementation Report**: `AGENT_9_CONTENT_FILTER_REPORT.md`
- **User Preferences**: `js/user-preferences.js`
- **Asset Service**: `js/services/asset-service.js`
- **Content Filter**: `js/components/content-filter.js`

---

**Need Help?**
Check console logs, Firestore rules, and Firebase indexes first!
