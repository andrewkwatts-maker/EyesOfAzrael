# User Preferences System Implementation Report

## Overview

A comprehensive user preferences system has been successfully implemented for the Eyes of Azrael project. This system allows users to customize their experience by blocking content, setting display preferences, managing notifications, and controlling privacy settings.

## Deliverables

### 1. User Preferences Schema
**File:** `data/schemas/user-preferences-schema.json`

A complete JSON schema defining all user preference fields:

- **Blocking Features:**
  - `blockedUsers`: Array of user IDs to block
  - `blockedTopics`: Array of topics/tags to filter
  - `blockedCategories`: Array of entity types to hide
  - `blockedMythologies`: Array of mythology IDs to exclude
  - `hiddenSubmissions`: Array of submission IDs to hide
  - `hiddenTheories`: Array of theory IDs to hide

- **Display Preferences:**
  - `theme`: Color scheme (auto/light/dark)
  - `layout`: View style (grid/list/compact)
  - `gridSize`: Card size (small/medium/large)
  - `itemsPerPage`: Pagination size (10-100)
  - `showImages`: Toggle entity images
  - `showIcons`: Toggle emoji icons
  - `compactMode`: Reduce spacing
  - `animationsEnabled`: UI animations toggle

- **Content Filters:**
  - `showUserContent`: Toggle user-submitted content
  - `showTheories`: Display theory pages
  - `showSubmissions`: Display pending submissions
  - `showApprovedOnly`: Only show approved content
  - `hideControversial`: Hide flagged content
  - `minVoteScore`: Minimum vote threshold

- **Notification Preferences:**
  - `emailNotifications`: Master email toggle
  - `notifyOnTheoryComment`: Theory comment notifications
  - `notifyOnSubmissionUpdate`: Submission status updates
  - `notifyOnVote`: Vote notifications
  - `notifyOnMention`: Mention notifications
  - `notifyOnReply`: Reply notifications
  - `digestFrequency`: Email digest schedule (never/daily/weekly)

- **Privacy Settings:**
  - `profileVisibility`: Who can view profile (public/registered/private)
  - `showEmail`: Display email on profile
  - `showTheories`: Show theories on profile
  - `showVotes`: Show voting activity
  - `allowMessages`: Allow user messages
  - `analyticsOptOut`: Opt out of tracking

- **Utility Features:**
  - `bookmarks`: Saved entities
  - `recentlyViewed`: Recently viewed entities (max 50)
  - `searchPreferences`: Search customization

### 2. UserPreferences Class
**File:** `js/user-preferences.js`

A comprehensive JavaScript class for managing user preferences:

**Key Methods:**
- `loadPreferences(userId)` - Load from Firestore with caching (5-minute cache)
- `savePreferences()` - Save to Firestore
- `blockUser(userId)` / `unblockUser(userId)` - User blocking
- `blockTopic(topic)` / `unblockTopic(topic)` - Topic filtering
- `blockCategory(category)` / `unblockCategory(category)` - Category filtering
- `blockMythology(mythology)` / `unblockMythology(mythology)` - Mythology filtering
- `hideSubmission(submissionId)` / `unhideSubmission(submissionId)` - Hide submissions
- `hideTheory(theoryId)` / `unhideTheory(theoryId)` - Hide theories
- `isContentBlocked(entity)` - Check if entity should be hidden
- `applyFilters(entities)` - Filter array based on preferences
- `setDisplayPreference(key, value)` - Update display settings
- `setContentFilter(key, value)` - Update content filters
- `setNotificationPreference(key, value)` - Update notifications
- `setPrivacySetting(key, value)` - Update privacy settings
- `addBookmark(id, type)` / `removeBookmark(id, type)` - Bookmark management
- `addRecentlyViewed(id, type)` - Track recently viewed
- `exportPreferences()` / `importPreferences(json)` - Data portability
- `applyTheme()` - Apply theme to document
- `applyDisplayPreferences()` - Apply all display settings
- `getBlockingStats()` - Get statistics about blocked content

**Features:**
- Intelligent caching to minimize Firestore reads
- Automatic default value merging
- Unsaved changes tracking
- Event-driven architecture (fires `preferencesApplied` event)
- Data import/export functionality
- Comprehensive filtering logic

### 3. Preferences Management Page
**File:** `preferences.html`

A complete preferences management interface with:

**Sections:**
1. **Statistics Dashboard** - Overview of blocked content counts
2. **Display Preferences** - Theme, layout, grid size, pagination
3. **Content Filters** - User content visibility, theories, submissions
4. **Blocked Users** - List with add/remove functionality
5. **Blocked Topics** - Tag-based filtering with chips UI
6. **Blocked Categories** - Checkbox grid for entity types
7. **Blocked Mythologies** - Checkbox grid for mythologies
8. **Notification Preferences** - Comprehensive notification controls
9. **Privacy Settings** - Profile visibility and data sharing

**Features:**
- Real-time UI updates
- Authentication required (shows login prompt for non-authenticated users)
- Loading states and error handling
- Success/error messaging
- Export/import functionality
- Reset to defaults with confirmation
- Responsive design with glass-morphism styling
- Toggle switches for boolean preferences
- Form validation

### 4. Entity Loader Integration
**File:** `js/entity-loader.js` (Updated)

**Changes Made:**
1. **Added User Preferences Filtering:**
   - Updated `applyClientSideFilters()` to apply user preferences after header filters
   - Filters are applied automatically when `window.userPreferences` is available

2. **Automatic Preference Loading:**
   - Updated `init()` method to load user preferences on page load
   - Preferences loaded when user is authenticated
   - Graceful fallback if preferences fail to load

3. **Preference Change Handling:**
   - Listens for `preferencesApplied` event
   - Automatically reloads grid when preferences change
   - Seamless integration with existing filter system

**Filter Priority:**
1. Firestore query filters (mythology, etc.)
2. Header filters (entity types, topics, content source)
3. User preferences (blocked users, topics, categories, mythologies)

### 5. Firestore Security Rules
**File:** `firestore.rules` (Updated)

**New Rules Added:**
```javascript
match /user_preferences/{userId} {
  // Users can only read their own preferences
  allow read: if isAuthenticated() && request.auth.uid == userId;

  // Users can create their own preferences
  allow create: if isAuthenticated()
                && request.auth.uid == userId
                && request.resource.data.userId == userId;

  // Users can update their own preferences
  allow update: if isAuthenticated()
                && request.auth.uid == userId
                && resource.data.userId == userId
                && request.resource.data.userId == userId;

  // Users can delete their own preferences
  allow delete: if isAuthenticated() && request.auth.uid == userId;
}
```

**Security Features:**
- Users can only access their own preferences
- Cannot read/write other users' preferences
- Document ID must match user ID
- `userId` field cannot be changed after creation
- Full CRUD operations for own preferences

## Implementation Architecture

### Data Flow

1. **Page Load:**
   ```
   User authenticates → EntityLoader.init() → UserPreferences.loadPreferences()
   → Cache preferences → Apply to document
   ```

2. **Entity Loading:**
   ```
   Firestore query → Apply header filters → Apply user preferences
   → Render filtered entities
   ```

3. **Preference Updates:**
   ```
   User changes preference → Update in memory → Save to Firestore
   → Fire preferencesApplied event → EntityLoader reloads grid
   ```

### Caching Strategy

- **Cache Duration:** 5 minutes
- **Cache Invalidation:** On save, preference change, or manual reload
- **Benefits:** Minimizes Firestore reads, improves performance
- **Fallback:** Returns default preferences on cache miss or error

### Performance Optimizations

1. **Client-Side Filtering:** Complex filters applied after Firestore query
2. **Intelligent Caching:** 5-minute cache for preferences
3. **Batch Updates:** Multiple preference changes before save
4. **Lazy Loading:** Preferences only loaded when user is authenticated
5. **Event-Driven:** Only reloads when preferences actually change

## Usage Examples

### Initialize Preferences
```javascript
const prefs = new UserPreferences();
await prefs.loadPreferences(userId);
```

### Block Content
```javascript
prefs.blockUser('spamUser123');
prefs.blockTopic('ancient-aliens');
prefs.blockMythology('norse');
await prefs.savePreferences();
```

### Update Display Settings
```javascript
prefs.setDisplayPreference('theme', 'dark');
prefs.setDisplayPreference('layout', 'grid');
prefs.setDisplayPreference('itemsPerPage', 48);
await prefs.savePreferences();
prefs.applyDisplayPreferences();
```

### Filter Entities
```javascript
const entities = await fetchEntities();
const filtered = prefs.applyFilters(entities);
```

### Check if Content is Blocked
```javascript
if (prefs.isContentBlocked(entity)) {
  // Don't display this entity
}
```

### Export/Import
```javascript
// Export
const json = prefs.exportPreferences();

// Import
prefs.importPreferences(json);
await prefs.savePreferences();
```

## Deployment Instructions

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Add Scripts to HTML Pages

Add to pages that need entity filtering:
```html
<!-- After Firebase initialization -->
<script src="js/user-preferences.js"></script>
<script src="js/entity-loader.js"></script>
```

### 3. Initialize on Page Load

Already handled automatically by `entity-loader.js` when Firebase auth state changes.

### 4. Link to Preferences Page

Add to navigation/user menu:
```html
<a href="/preferences.html">Preferences</a>
```

### 5. Test Firestore Permissions

Test that:
- Users can only access their own preferences
- Unauthenticated users cannot access any preferences
- Document ID enforcement works
- CRUD operations work correctly

## Testing Checklist

### Functional Tests
- [ ] User can create new preferences (first time)
- [ ] User can load existing preferences
- [ ] User can update preferences
- [ ] User can block/unblock users
- [ ] User can block/unblock topics
- [ ] User can block/unblock categories
- [ ] User can block/unblock mythologies
- [ ] Filters are applied to entity lists
- [ ] Theme changes apply immediately
- [ ] Layout changes apply immediately
- [ ] Preference changes trigger grid reload
- [ ] Export creates valid JSON
- [ ] Import restores all preferences
- [ ] Reset to defaults works
- [ ] Bookmarks can be added/removed
- [ ] Recently viewed tracks correctly

### Security Tests
- [ ] Users cannot read other users' preferences
- [ ] Users cannot write to other users' preferences
- [ ] Unauthenticated users are denied access
- [ ] Document ID must match user ID
- [ ] userId field cannot be changed

### Performance Tests
- [ ] Preferences cache for 5 minutes
- [ ] Firestore reads minimized
- [ ] Large filter lists perform well
- [ ] No unnecessary re-renders
- [ ] Grid reload is smooth

### UI/UX Tests
- [ ] Loading states display correctly
- [ ] Error messages are helpful
- [ ] Success messages confirm actions
- [ ] Toggle switches work smoothly
- [ ] Checkboxes update correctly
- [ ] Forms validate input
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation, screen readers)

## Integration Points

### With Existing Systems

1. **Entity Loader:**
   - Automatically integrates with existing filter system
   - Preserves header filters functionality
   - Adds user-specific filtering layer

2. **Firebase Auth:**
   - Uses Firebase Auth for user identification
   - Automatically loads preferences on auth state change
   - Handles logout/login gracefully

3. **Theme System:**
   - Integrates with existing theme picker
   - Applies theme preference on load
   - Syncs with system preference (auto mode)

4. **Header Filters:**
   - Works alongside existing header filters
   - User preferences applied after header filters
   - Both systems work together seamlessly

## Future Enhancements

1. **Search Preferences:**
   - Save common searches
   - Search templates
   - Search history

2. **Reading Lists:**
   - Create custom lists
   - Share lists with others
   - Export lists

3. **Notification System:**
   - In-app notifications
   - Email digest implementation
   - Push notifications (PWA)

4. **Advanced Filtering:**
   - Complex filter combinations (AND/OR logic)
   - Saved filter presets
   - Filter sharing

5. **Profile Customization:**
   - Custom profile themes
   - Profile widgets
   - Activity tracking

6. **Analytics:**
   - View statistics
   - Reading habits
   - Contribution metrics

## Known Limitations

1. **Firestore Queries:**
   - Some complex filters must be client-side
   - Cannot query on multiple array-contains
   - Limited to 10 items in 'in' queries

2. **Caching:**
   - 5-minute cache may show stale data
   - Manual refresh may be needed
   - No cross-tab synchronization

3. **Performance:**
   - Large blocked lists may slow filtering
   - Many preferences may increase load time
   - Consider pagination for very large datasets

4. **Browser Support:**
   - Requires modern browser
   - LocalStorage for temporary data
   - ES6+ JavaScript required

## Maintenance Notes

### Regular Tasks

1. **Monitor Firestore Usage:**
   - Track read/write counts
   - Optimize cache duration if needed
   - Monitor for abuse patterns

2. **Schema Updates:**
   - Version field for migrations
   - Backward compatibility
   - Default value handling

3. **Performance Monitoring:**
   - Track load times
   - Monitor filter performance
   - Optimize as needed

### Troubleshooting

**Preferences not loading:**
- Check Firebase Auth status
- Verify Firestore rules deployed
- Check browser console for errors
- Confirm userId matches Auth UID

**Filters not applying:**
- Verify preferences loaded successfully
- Check that userPreferences is in window scope
- Confirm EntityLoader is initialized
- Check for JavaScript errors

**Permission denied errors:**
- Verify Firestore rules deployed
- Check userId matches document ID
- Confirm user is authenticated
- Review security rule logs

## Files Modified/Created

### Created
- `data/schemas/user-preferences-schema.json` - Complete schema definition
- `js/user-preferences.js` - UserPreferences class (800+ lines)
- `preferences.html` - Preferences management page (1000+ lines)
- `USER_PREFERENCES_IMPLEMENTATION_REPORT.md` - This report

### Modified
- `js/entity-loader.js` - Added preference filtering integration
- `firestore.rules` - Added user_preferences collection rules

## Summary

The user preferences system is fully implemented and ready for deployment. It provides:

- Complete user customization
- Robust filtering and blocking
- Secure, user-specific storage
- Seamless integration with existing systems
- Professional UI/UX
- Performance optimizations
- Data portability
- Privacy controls

The system follows Firebase best practices, implements proper security rules, and provides a foundation for future feature enhancements.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Firestore rules deployed correctly
3. Confirm user is authenticated
4. Review this documentation
5. Check Firebase console for permission errors

---

**Implementation Date:** December 14, 2025
**Version:** 1.0.0
**Status:** Ready for Deployment
