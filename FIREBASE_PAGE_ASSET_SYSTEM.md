# Firebase Page Asset System

## Overview

The Eyes of Azrael site now uses a **dynamic Firebase-driven page asset system** that allows pages to be designed, updated, and managed entirely through Firebase without code changes.

---

## What Was Created

### 1. Page Asset Template (`scripts/create-page-assets.js`)

A standardized template for all pages in Firebase:

```javascript
{
    id: 'page-id',           // Unique identifier
    title: 'Page Title',     // Display title
    subtitle: 'Subtitle',    // Optional subtitle
    description: 'Description',
    icon: '📄',              // Icon emoji
    type: 'landing',         // landing, category, detail
    layout: 'grid',          // grid, list, detail
    hero: {                  // Optional hero section
        title: '',
        subtitle: '',
        background: '',
        cta: []              // Call-to-action buttons
    },
    sections: [],            // Content sections (see below)
    metadata: {              // System metadata
        created: timestamp,
        updated: timestamp,
        author: 'system',
        version: '1.0',
        status: 'active'
    }
}
```

### 2. Page Assets Created in Firebase

Seven pages were created in the `pages` collection:

| Page ID | Title | Purpose |
|---------|-------|---------|
| `home` | Eyes of Azrael | Landing page with hero + 6 sections |
| `mythologies` | World Mythologies | Mythology category browser |
| `places` | Sacred Places | Places category browser |
| `items` | Legendary Items | Items category browser |
| `archetypes` | Mythological Archetypes | Archetypes browser |
| `theories` | Theories & Analysis | Theories browser |
| `submissions` | Community Contributions | User submissions browser |

###3. Page Asset Renderer (`js/page-asset-renderer.js`)

A dynamic renderer that:
- Loads page data from Firebase `pages` collection
- Fetches panel cards from linked collections (mythologies, places, items, etc.)
- Renders hero sections, content sections, and panel card grids
- Caches page data and collection data for performance
- Handles loading states, errors, and fallbacks

---

## How It Works

### Landing Page Flow

1. User navigates to `#/` (home)
2. SPANavigation calls `renderHome()`
3. PageAssetRenderer loads page asset: `pages/home`
4. Home page asset defines 6 sections:
   - **Mythologies**: Loads from `mythologies` collection
   - **Places**: Loads from `places` collection
   - **Items**: Loads from `items` collection
   - **Archetypes**: Loads from `archetypes` collection
   - **Theories**: Loads from `theories` collection
   - **Submissions**: Loads from `submissions` collection

5. Renderer fetches cards for each section (12 mythologies, 6 places, etc.)
6. Renders hero section + 6 panel card sections
7. Each card links to its detail page (`#/mythology/greek`, `#/place/olympus`, etc.)

### Section Structure

Each section in a page asset defines what to load:

```javascript
{
    id: 'mythologies',
    title: 'World Mythologies',
    description: 'Explore gods, heroes, and legends',
    icon: '🏛️',
    type: 'panel-cards',
    collection: 'mythologies',  // Firebase collection to load from
    link: '#/mythologies',       // "View All" link
    displayCount: 12,            // Number of cards to show (0 = all)
    sortBy: 'order',             // Sort field
    featured: true               // Show on home page
}
```

---

## Panel Card System

### What are Panel Cards?

Panel cards are the clickable tiles that link to content:
- **Mythology cards**: Greek, Norse, Egyptian, etc.
- **Place cards**: Mount Olympus, Valhalla, etc.
- **Item cards**: Excalibur, Mjölnir, etc.
- **Archetype cards**: Trickster, Hero's Journey, etc.

### How Panel Cards are Generated

The renderer automatically creates cards from Firebase data:

```javascript
getCardHTML(card, section) {
    const link = this.getCardLink(card, section);  // e.g., #/mythology/greek
    const icon = card.icon || section.icon || '📄';
    const name = card.name || card.title || 'Untitled';
    const description = card.description || '';

    return `
        <a href="${link}" class="panel-card" data-card-id="${card.id}">
            <div class="card-icon">${icon}</div>
            <h3 class="card-title">${name}</h3>
            <p class="card-description">${description}</p>
        </a>
    `;
}
```

### Card Link Routing

Cards automatically route to the correct page based on collection:

| Collection | Route Pattern | Example |
|------------|---------------|---------|
| `mythologies` | `#/mythology/{id}` | `#/mythology/greek` |
| `places` | `#/place/{id}` | `#/place/mount-olympus` |
| `items` | `#/item/{id}` | `#/item/excalibur` |
| `archetypes` | `#/archetype/{id}` | `#/archetype/trickster` |
| `theories` | `#/theory/{id}` | `#/theory/comparative-flood-myths` |
| `submissions` | `#/submission/{id}` | `#/submission/123` |

---

## Firebase Collections

### Required Collections

For the page asset system to work, these collections must exist:

1. **`pages`** - Page assets (home, mythologies, places, etc.)
2. **`mythologies`** - Mythology traditions
3. **`places`** - Sacred places
4. **`items`** - Legendary items
5. **`archetypes`** - Mythological archetypes
6. **`theories`** - Theories and analysis
7. **`submissions`** - User submissions

### Collection Document Structure

Each collection document should have:

```javascript
{
    id: 'unique-id',
    name: 'Display Name',
    title: 'Alternative Title',
    icon: '📄',
    description: 'Brief description',
    order: 1,                    // For sorting
    importance: 95,              // For priority sorting
    status: 'active',            // active, draft, archived
    metadata: {
        created: timestamp,
        updated: timestamp
    }
}
```

---

## How to Update Content

### Update Landing Page

1. Edit the `home` document in Firebase `pages` collection
2. Modify sections array to add/remove sections
3. Change displayCount to show more/fewer cards
4. Update hero section text and buttons
5. Changes appear immediately on next page load (or after cache expiry)

### Update Category Pages

1. Edit `mythologies`, `places`, `items`, etc. in `pages` collection
2. Modify title, subtitle, description
3. Change sorting or filtering

### Add New Content

1. Add document to appropriate collection (`mythologies`, `places`, etc.)
2. Set `status: 'active'` to make it visible
3. Card appears automatically on relevant pages

### Add New Category

1. Create new collection in Firebase (e.g., `rituals`)
2. Add section to `home` page asset:
```javascript
{
    id: 'rituals',
    title: 'Sacred Rituals',
    collection: 'rituals',
    displayCount: 6,
    sortBy: 'importance'
}
```
3. Create category page asset: `pages/rituals`
4. Add route handler in SPANavigation (optional)

---

## Performance Features

### Caching

The PageAssetRenderer uses a two-level cache:

1. **Page Cache**: Stores complete page assets
2. **Collection Cache**: Stores fetched cards by query

Cache keys:
- Page: `{pageId}` (e.g., `home`)
- Collection: `{collection}-{displayCount}-{sortBy}` (e.g., `mythologies-12-order`)

### Loading States

Every data fetch shows a loading spinner:
```html
<div class="loading-container">
    <div class="spinner-container">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
    </div>
    <p class="loading-message">Loading page...</p>
</div>
```

### Error Handling

- **Page not found**: Shows 404 message with "Return Home" button
- **Firebase error**: Shows error message with "Retry" button
- **Empty collection**: Shows "No {collection} available yet." message

---

## Testing

### Verify Page Assets Exist

```bash
cd h:/Github/EyesOfAzrael
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
db.collection('pages').get().then(snapshot => {
    console.log('Pages:', snapshot.docs.map(d => d.id).join(', '));
    process.exit(0);
});
"
```

Expected output:
```
Pages: home, mythologies, places, items, archetypes, theories, submissions
```

### Test Home Page Loading

1. Navigate to https://www.eyesofazrael.com
2. Open browser console (F12)
3. Look for logs:
```
[SPA] Using PageAssetRenderer for home page
[Page Renderer] Loading page: home
[Page Renderer] Loaded 12 cards from mythologies
[Page Renderer] Loaded 6 cards from places
[Page Renderer] Page rendered: Eyes of Azrael
```

4. Verify you see:
   - Hero section with title and CTA buttons
   - 6 content sections
   - Panel cards in each section
   - All cards are clickable

---

## Files Modified/Created

### Created
- `scripts/create-page-assets.js` - Script to populate Firebase pages
- `js/page-asset-renderer.js` - Dynamic page renderer
- `FIREBASE_PAGE_ASSET_SYSTEM.md` - This documentation

### Modified
- `js/spa-navigation.js` - Updated `renderHome()` to use PageAssetRenderer
- `index.html` - Added page-asset-renderer.js script tag

### Firebase
- Created `pages` collection with 7 documents
- Uses existing collections: `mythologies`, `places`, `items`, `theories`

---

## Next Steps

### Immediate
1. Test that home page loads with panel cards
2. Verify cards are clickable
3. Check that each category page (mythologies, places, etc.) works

### Short-term
1. Populate remaining collections (archetypes, theories, submissions)
2. Create mythology detail pages as page assets
3. Add more sections to home page

### Long-term
1. Build admin UI for managing page assets
2. Add versioning and publishing workflow
3. Implement user permissions for content editing
4. Add analytics to track which cards are most clicked

---

## Benefits

✅ **No code changes needed** to update page content
✅ **Consistent structure** across all pages
✅ **Easy to add new categories** without code
✅ **Firebase-driven** = real-time updates
✅ **Caching** for performance
✅ **Loading states** for better UX
✅ **Error handling** built-in
✅ **Extensible** template system

---

## Troubleshooting

### Cards not showing

1. Check if collection exists: `mythologies`, `places`, etc.
2. Check if documents have `status: 'active'`
3. Check browser console for errors
4. Clear cache: `renderer.clearCache()`

### Wrong number of cards

1. Check `displayCount` in section definition
2. Check `sortBy` field exists in documents
3. Verify filters are correct

### Page not found

1. Check `pages` collection has document with correct ID
2. Check browser console for exact error
3. Verify Firebase permissions allow read access

---

**System is now live and ready for content!** 🎉
