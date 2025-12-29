# User Notes/Annotations System Documentation

## Overview

The User Notes system allows authenticated users to add personal annotations, interpretations, and insights to standard mythology assets (deities, heroes, creatures, etc.). Notes are displayed publicly, can be voted on by other users, and support markdown formatting.

## Features

### Core Functionality
- **Public Notes**: Anyone can read notes; authenticated users can create them
- **Markdown Support**: Rich text formatting including bold, italic, links, and lists
- **Real-time Updates**: Notes update live using Firestore listeners
- **User Ownership**: Users can edit and delete only their own notes
- **Voting System**: Placeholder for voting (implemented by Agent 8)
- **Sort Options**: Sort by Most Helpful, Recent, or Most Debated
- **XSS Protection**: All user content is sanitized to prevent security vulnerabilities

### Spam Prevention
- **Rate Limiting**: Maximum 10 notes per hour per user
- **Character Limits**: 20-2000 characters per note
- **Duplicate Detection**: Prevents posting identical content multiple times
- **Content Validation**: Enforces minimum quality standards

## Architecture

### Firestore Schema

```
user_notes/
  {assetType}/           # deity, hero, creature, etc.
    {assetId}/           # specific asset ID (e.g., "zeus")
      notes/
        {noteId}/
          userId: string
          userName: string
          userAvatar: string
          content: string (markdown)
          createdAt: timestamp
          updatedAt: timestamp
          votes: number (cached total)
          isEdited: boolean
          assetType: string
          assetId: string
```

### File Structure

```
js/
  services/
    notes-service.js          # CRUD operations and business logic
  components/
    user-notes.js             # UI controller and markdown rendering

components/
  user-notes-section.html     # HTML template and component showcase

css/
  user-notes.css              # Styling for notes UI

firestore-user-notes-rules.txt  # Security rules for Firebase
```

## Usage

### Integration with Entity Pages

The notes system is automatically integrated into all entity pages via `entity-renderer-firebase.js`. The notes section appears at the bottom of each entity detail page.

**Required Scripts** (add to entity pages):
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>

<!-- Notes System -->
<script src="/js/services/notes-service.js"></script>
<script src="/js/components/user-notes.js"></script>

<!-- Entity Renderer (includes notes integration) -->
<script src="/js/entity-renderer-firebase.js"></script>

<!-- Styles -->
<link rel="stylesheet" href="/css/user-notes.css">
<link rel="stylesheet" href="/css/spinner.css">
```

### Manual Integration

If not using the entity renderer, you can manually add notes to any page:

```html
<!-- Add the notes section HTML -->
<section class="user-notes-section" id="userNotesSection" data-asset-type="deity" data-asset-id="zeus">
  <!-- See components/user-notes-section.html for full structure -->
</section>

<!-- Initialize the component -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const notesComponent = new UserNotesComponent('userNotesSection');
    await notesComponent.init('deity', 'zeus');
  });
</script>
```

## API Reference

### NotesService

#### Methods

**`createNote(assetType, assetId, content)`**
- Creates a new note
- Validates content length and format
- Checks rate limiting and duplicates
- Returns: Promise<Object> with note data

**`updateNote(assetType, assetId, noteId, content)`**
- Updates an existing note
- Verifies user ownership
- Marks note as edited
- Returns: Promise<Object> with updated note

**`deleteNote(assetType, assetId, noteId)`**
- Deletes a note
- Verifies user ownership
- Returns: Promise<void>

**`getNotes(assetType, assetId, sortBy, limit)`**
- Fetches notes for an asset
- Sort options: 'votes', 'recent', 'debated'
- Returns: Promise<Array> of notes

**`listenToNotes(assetType, assetId, callback, sortBy)`**
- Sets up real-time listener for notes
- Calls callback with updated notes array
- Returns: Unsubscribe function

**`getNoteCount(assetType, assetId)`**
- Gets total number of notes for an asset
- Returns: Promise<number>

#### Rate Limiting Configuration

```javascript
MAX_NOTES_PER_HOUR = 10        // Maximum notes per user per hour
MIN_NOTE_LENGTH = 20           // Minimum characters
MAX_NOTE_LENGTH = 2000         // Maximum characters
RATE_LIMIT_WINDOW = 3600000    // 1 hour in milliseconds
```

### UserNotesComponent

#### Methods

**`init(assetType, assetId)`**
- Initializes the notes component
- Sets up event listeners
- Loads notes with real-time updates

**`openNoteEditor(note)`**
- Opens the note editor modal
- If `note` is provided, opens in edit mode
- Otherwise opens in create mode

**`closeNoteEditor()`**
- Closes the note editor modal
- Clears form data

**`cleanup()`**
- Removes event listeners
- Unsubscribes from real-time updates

## Markdown Support

### Supported Syntax

- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Links**: `[text](url)`
- **Lists**: Lines starting with `-` or `1.`
- **Inline Code**: `` `code` ``

### Example

```markdown
This note discusses **Zeus's** role as *king of the gods*.

Key domains:
- Sky and thunder
- Justice and law
- Hospitality

Learn more at [Theoi Project](https://www.theoi.com)
```

## Security

### XSS Protection

All user content is sanitized before rendering:
1. HTML is escaped before processing
2. Markdown is rendered with strict patterns
3. Dangerous tags are removed (`<script>`, `<iframe>`, `<object>`)
4. Event handlers are stripped from all elements
5. `javascript:` URLs are blocked
6. Links open in new tabs with `rel="noopener noreferrer"`

### Firestore Security Rules

```javascript
// Read: Public
allow read: if true;

// Create: Authenticated users only
allow create: if request.auth != null
              && request.resource.data.userId == request.auth.uid
              && content.size() >= 20 && content.size() <= 2000;

// Update/Delete: Owner only
allow update, delete: if request.auth != null
                       && resource.data.userId == request.auth.uid;
```

## Styling

### CSS Variables

The notes system uses theme variables for consistent styling:

```css
--color-primary       /* Primary accent color */
--color-secondary     /* Secondary accent color */
--color-surface       /* Card backgrounds */
--color-border        /* Border colors */
--color-text-primary  /* Main text */
--color-text-secondary /* Muted text */
--space-*            /* Spacing scale */
--radius-*           /* Border radius scale */
```

### Customization

To customize note appearance, override these classes:

```css
.note-card { /* Individual note styling */ }
.note-header { /* Note author info */ }
.note-content { /* Note body text */ }
.note-footer { /* Vote buttons and badges */ }
```

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Escape key closes modals
- Form inputs have proper labels

### Screen Readers
- ARIA labels on buttons
- Semantic HTML structure
- Focus management in modals

### Responsive Design
- Mobile-first layout
- Touch-friendly buttons (min 44px)
- Readable text sizes (minimum 16px)

## Performance

### Optimization Strategies
- **Real-time Listeners**: Automatic updates without polling
- **Pagination**: Limited to 50 notes by default
- **Lazy Loading**: CSS loaded on-demand
- **Debounced Updates**: Character counter updates efficiently

### Firestore Costs
- Read: ~1 read per note loaded
- Write: 1 write per create/update/delete
- Real-time: Continuous listener (counts as reads on updates)

**Cost Optimization Tips**:
- Use pagination to limit initial load
- Detach listeners when user navigates away
- Cache note counts client-side

## Future Enhancements (Agent 8)

### Voting System
- Upvote/downvote functionality
- Vote aggregation
- "Most Helpful" sorting based on votes
- Vote persistence per user

### Advanced Features (Future)
- Replies/threading
- @ mentions
- Rich media embedding
- Admin moderation tools
- Report spam/abuse
- Note bookmarking

## Troubleshooting

### Notes Not Appearing
1. Check Firebase initialization
2. Verify security rules are deployed
3. Check browser console for errors
4. Ensure required scripts are loaded

### Cannot Create Notes
1. Verify user is authenticated
2. Check rate limiting (max 10/hour)
3. Validate note length (20-2000 chars)
4. Check for duplicate content

### Real-time Updates Not Working
1. Verify Firestore indexes are created
2. Check listener setup in component
3. Ensure cleanup isn't called prematurely

## Support

For issues or questions:
- Check browser console for errors
- Review Firestore security rules
- Verify all required scripts are loaded
- Check authentication state

## License

Part of the Eyes of Azrael project.
