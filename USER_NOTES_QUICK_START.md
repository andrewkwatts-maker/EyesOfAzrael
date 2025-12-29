# User Notes System - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Include Required Files

Add to your entity detail pages:

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/user-notes.css">
<link rel="stylesheet" href="/css/spinner.css">

<!-- JavaScript (after Firebase SDK) -->
<script src="/js/services/notes-service.js"></script>
<script src="/js/components/user-notes.js"></script>
```

### 2. Add HTML Section

The notes section is automatically added by `entity-renderer-firebase.js`. If you're not using it, add manually:

```html
<section class="user-notes-section" id="userNotesSection"
         data-asset-type="deity"
         data-asset-id="zeus">
  <!-- See components/user-notes-section.html for full markup -->
</section>
```

### 3. Initialize Component

```javascript
// Automatic (via entity-renderer-firebase.js)
// Already integrated! No action needed.

// Manual initialization
const notesComponent = new UserNotesComponent('userNotesSection');
await notesComponent.init('deity', 'zeus');
```

### 4. Deploy Firestore Rules

Copy rules from `firestore-user-notes-rules.txt` to Firebase Console:
- Firestore Database > Rules tab
- Paste and publish

### 5. Create Indexes

In Firebase Console > Firestore > Indexes:

**Single Collection Indexes**:
```
Collection: user_notes/{assetType}/{assetId}/notes
- votes (Descending) + createdAt (Descending)
- createdAt (Descending)
```

**Collection Group Index**:
```
Collection Group: notes
- userId (Ascending) + createdAt (Descending)
```

## ✅ You're Done!

Notes now appear on all entity pages automatically.

## 📝 Common Tasks

### Get Note Count
```javascript
const count = await window.notesService.getNoteCount('deity', 'zeus');
```

### Listen to Notes
```javascript
const unsubscribe = window.notesService.listenToNotes(
  'deity',
  'zeus',
  (notes) => console.log('Updated notes:', notes),
  'votes' // or 'recent', 'debated'
);

// Clean up
unsubscribe();
```

### Create Note (Programmatically)
```javascript
const note = await window.notesService.createNote(
  'deity',
  'zeus',
  'This is my insightful note about Zeus!'
);
```

## 🎨 Customization

Override CSS variables:
```css
.user-notes-section {
  --notes-bg: rgba(0, 0, 0, 0.3);
  --notes-border: var(--color-primary);
}
```

## 🔧 Troubleshooting

### Notes not appearing?
1. Check browser console for errors
2. Verify Firebase is initialized
3. Check security rules are deployed
4. Ensure scripts are loaded in order

### Can't create notes?
1. User must be authenticated
2. Check rate limit (10/hour)
3. Note must be 20-2000 characters
4. Check for duplicate content

### Real-time updates not working?
1. Verify Firestore indexes exist
2. Check listener is active
3. Ensure cleanup isn't called prematurely

## 📚 Full Documentation

See `USER_NOTES_DOCUMENTATION.md` for complete details.

## 🤝 Integration with Voting (Agent 8)

Vote buttons are already in place! Agent 8 will implement:
- Vote CRUD operations
- Vote aggregation
- User vote state tracking

## 📞 Need Help?

Check:
1. Browser console for errors
2. Network tab for Firebase requests
3. Firestore rules simulator
4. `USER_NOTES_DOCUMENTATION.md`
