# Content Filter System Integration Guide

## Overview

The Eyes of Azrael wiki now includes a comprehensive content filtering system that allows users to control what user-submitted content they see. This provides a wiki-like experience where users can curate their own view of the content.

## System Components

### 1. Core Filter System
**File:** `js/content-filter.js`

The content filter manager that handles all filtering logic:

```javascript
// Check if content should be shown
window.contentFilter.shouldShow(theory);

// Set filter mode
window.contentFilter.setMode('defaults-only'); // or 'defaults-self' or 'everyone'

// Hide/unhide specific users
window.contentFilter.hideUser(userId);
window.contentFilter.unhideUser(userId);

// Hide/unhide topics/subtopics
window.contentFilter.hideTopic(topicId);
window.contentFilter.unhideTopic(subtopicId);
```

### 2. Filter Settings UI
**Files:**
- `js/components/filter-settings-modal.js` - Settings modal
- `css/filter-settings.css` - Modal styling

Opens a modal where users can manage their filter preferences.

```javascript
// Open settings modal
window.filterSettingsModal.open();
```

### 3. Header Button
**File:** `js/components/filter-header-button.js`

Adds a filter button to the site header with a badge showing hidden item count.

### 4. Content UI Integration
**File:** `js/content-filter-ui.js`

Provides utilities for integrating filters into content pages:

```javascript
// Initialize filters for a list of theories
window.contentFilterUI.initializeForTheories(theories, '.container-selector');

// Filter theories before rendering
const filtered = window.contentFilterUI.filterTheories(theories);

// Get summary HTML
const summary = window.contentFilterUI.getFilterSummary(total, filtered);
```

## Integration Steps

### Step 1: Include Required Files

Add to your HTML `<head>` section:

```html
<!-- Filter CSS -->
<link rel="stylesheet" href="../../css/filter-settings.css">

<!-- Filter JavaScript (after Firebase) -->
<script src="../../js/content-filter.js"></script>
<script src="../../js/content-filter-ui.js"></script>
<script src="../../js/components/filter-settings-modal.js"></script>
<script src="../../js/components/filter-header-button.js"></script>
```

### Step 2: Prepare Theory Cards

Ensure your theory cards have `data-theory-id` attribute:

```html
<div class="theory-card" data-theory-id="abc123">
    <h3>Theory Title</h3>
    <p>Theory content...</p>
</div>
```

### Step 3: Initialize Filters

After rendering theories to the DOM:

```javascript
async function loadAndDisplayTheories() {
    // Fetch theories
    const theories = await fetchTheories();

    // Render theories to DOM
    renderTheories(theories);

    // Initialize filter controls and apply filtering
    window.contentFilterUI.initializeForTheories(theories, '#theories-container');

    // Show filter summary (optional)
    const filtered = window.contentFilterUI.filterTheories(theories);
    const summaryHTML = window.contentFilterUI.getFilterSummary(
        theories.length,
        filtered.length
    );

    // Insert summary before theories
    document.querySelector('#filter-summary-container').innerHTML = summaryHTML;
}
```

### Step 4: Handle Dynamic Updates

The system automatically handles updates when filter settings change via the `contentFilterChanged` event:

```javascript
// Optional: Listen for filter changes to update UI
window.addEventListener('contentFilterChanged', (e) => {
    console.log('Filters changed:', e.detail);
    // Re-count visible items, update stats, etc.
});
```

## Filter Modes

### 🏛️ Official Only (`defaults-only`)
- Shows only official Eyes of Azrael content
- All user submissions are hidden
- Best for users who want curated content only

### 🏛️ + 👤 Official + Mine (`defaults-self`)
- Shows official content plus user's own submissions
- Other users' content is hidden
- Default mode - balanced approach

### 🌍 Everyone (`everyone`)
- Shows all content from all users
- Full wiki experience
- Users can still hide specific users/topics

## Per-Item Filtering

Each user-submitted content card gets a dropdown menu (⋮) with options:

- **Hide this user**: Hides all content from this specific user
- **Hide topic**: Hides all content in this user-created topic
- **Hide subtopic**: Hides all content in this user-created subtopic

Clicking these options immediately hides the content and updates the filter settings.

## Theory Object Requirements

For filtering to work properly, theory objects must include:

```javascript
{
    id: 'abc123',               // Required: Unique ID
    userId: 'user123',          // Required for user content: User ID
    official: false,            // Optional: true for official content
    userTopic: 'Divine Math',   // Optional: User-created topic
    userSubtopic: 'Gematria',   // Optional: User-created subtopic
    title: 'Theory Title',
    // ... other fields
}
```

## Data Storage

### LocalStorage
Filter settings are stored in localStorage as `contentFilterSettings`:

```javascript
{
    mode: 'defaults-self',
    hiddenUsers: ['user1', 'user2'],
    hiddenTopics: ['topic1'],
    hiddenSubtopics: ['subtopic1']
}
```

### Firestore (Cloud Sync)
For signed-in users, settings also sync to Firestore:

**Collection:** `userSettings`
**Document ID:** `{userId}`
**Field:** `contentFilter`

```javascript
{
    contentFilter: {
        mode: 'defaults-self',
        hiddenUsers: [...],
        hiddenTopics: [...],
        hiddenSubtopics: [...]
    },
    updatedAt: timestamp
}
```

## Events

### `contentFilterChanged`
Fired when filter settings change:

```javascript
window.addEventListener('contentFilterChanged', (e) => {
    console.log('Mode:', e.detail.mode);
    console.log('Stats:', e.detail.stats);
    // { hiddenUsersCount, hiddenTopicsCount, hiddenSubtopicsCount }
});
```

### `contentFiltered`
Fired when content is filtered (after refresh):

```javascript
window.addEventListener('contentFiltered', (e) => {
    console.log('Content filtered at:', e.detail.timestamp);
    // Update counts, stats, etc.
});
```

## Example: Browse Page Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Browse Theories</title>
    <link rel="stylesheet" href="../../css/filter-settings.css">

    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="../../firebase-config.js"></script>

    <!-- Filter System -->
    <script src="../../js/content-filter.js"></script>
    <script src="../../js/content-filter-ui.js"></script>
    <script src="../../js/components/filter-settings-modal.js"></script>
    <script src="../../js/components/filter-header-button.js"></script>
</head>
<body>
    <header>
        <div class="header-content">
            <h1>Browse Theories</h1>
            <!-- Filter button auto-injected here -->
        </div>
    </header>

    <main>
        <!-- Filter summary (shows active filters) -->
        <div id="filter-summary-container"></div>

        <!-- Theories container -->
        <div id="theories-container"></div>
    </main>

    <script>
        async function loadTheories() {
            const db = firebase.firestore();
            const snapshot = await db.collection('theories')
                .orderBy('createdAt', 'desc')
                .get();

            const theories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Render theories
            const container = document.getElementById('theories-container');
            container.innerHTML = theories.map(theory => `
                <div class="theory-card" data-theory-id="${theory.id}">
                    <h3>${theory.title}</h3>
                    <p>${theory.summary}</p>
                </div>
            `).join('');

            // Initialize filters
            window.contentFilterUI.initializeForTheories(theories, '#theories-container');

            // Show summary
            const filtered = window.contentFilterUI.filterTheories(theories);
            document.getElementById('filter-summary-container').innerHTML =
                window.contentFilterUI.getFilterSummary(theories.length, filtered.length);
        }

        // Load on page ready
        document.addEventListener('DOMContentLoaded', loadTheories);
    </script>
</body>
</html>
```

## Styling Notes

### Card Positioning
Theory cards should have `position: relative` for the dropdown button to position correctly:

```css
.theory-card {
    position: relative;
    /* ... other styles */
}
```

### Filter Controls
The dropdown menu (⋮) appears in the top-right corner:

```css
.filter-controls {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 10;
}
```

### Filter Summary Banner
Optional banner showing active filters:

```css
.filter-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(...);
    border-radius: 0.75rem;
    margin-bottom: 2rem;
}
```

## Testing

### Test Filter Modes
1. Open filter settings (click 🎛️ Filter button in header)
2. Try each mode:
   - Official Only
   - Official + Mine
   - Everyone
3. Verify content appears/disappears correctly

### Test Per-User Hiding
1. Find a user-submitted theory
2. Click the ⋮ menu in top-right
3. Click "Hide this user"
4. Verify all content from that user disappears
5. Open filter settings → Hidden Items → Users tab
6. Verify user appears in list
7. Click "Unhide" to restore

### Test Per-Topic Hiding
1. Find content with a userTopic
2. Click ⋮ → "Hide topic: [topic name]"
3. Verify all content in that topic disappears
4. Check Hidden Items → Topics tab
5. Unhide to restore

## Troubleshooting

### Filters Not Working
- Verify `window.contentFilter` is defined (check browser console)
- Ensure theory objects have `userId` field for user content
- Check that `data-theory-id` attributes match theory IDs
- Verify `initializeForTheories()` is called after DOM render

### Dropdown Menu Not Appearing
- Ensure theory card has `position: relative`
- Check that theory is user content (not official)
- Verify CSS is loaded (`css/filter-settings.css`)

### Settings Not Persisting
- Check localStorage in browser DevTools
- For signed-in users, check Firestore `userSettings` collection
- Verify Firebase is initialized before content-filter.js loads

## Future Enhancements

Potential additions to the system:

1. **Tag Filtering**: Hide content by specific tags
2. **Date Range Filters**: Show content from specific time periods
3. **Quality Filters**: Filter by vote count, confidence level, etc.
4. **Export/Import**: Share filter settings with others
5. **Presets**: Save multiple filter configurations
6. **Community Moderation**: Report problematic content
7. **Collaborative Filtering**: See what others are hiding

## Support

For issues or questions about the content filter system:
- Check browser console for error messages
- Verify all required scripts are loaded
- Test with browser DevTools Network tab
- Check Firestore rules if cloud sync isn't working
