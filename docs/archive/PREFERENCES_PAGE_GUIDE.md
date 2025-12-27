# User Preferences Management Page - Complete Guide

## Overview

The User Preferences Management Page provides a comprehensive interface for users to customize their experience on Eyes of Azrael. This system integrates with Firebase Firestore for cloud synchronization and includes robust filtering, display, notification, and privacy controls.

## Table of Contents

1. [Features](#features)
2. [File Structure](#file-structure)
3. [Usage](#usage)
4. [Tab Breakdown](#tab-breakdown)
5. [Technical Implementation](#technical-implementation)
6. [Integration Guide](#integration-guide)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

## Features

### Content Filters
- **User-Generated Content Toggle**: Show/hide all user submissions
- **Content Source Selection**: Official only, Official + My Content, or Everyone
- **Mythology Filters**: Choose which mythologies to display (Jewish, Greek, Norse, etc.)
- **Entity Type Filters**: Filter by entity types (Deity, Hero, Creature, etc.)
- **Topic/Tag Filtering**: Block specific topics and tags

### Blocked Content Management
- **Blocked Users**: List of blocked users with avatars and unblock functionality
- **Blocked Topics**: Tag-based topic blocking with search/filter
- **Hidden Submissions**: Manage individually hidden content with restore options

### Display Settings
- **Theme**: Dark, Light, or Auto (system preference)
- **Layout**: Grid, List, or Compact view
- **Grid Columns**: 2-6 column grid layouts
- **Card Size**: Small, Medium, or Large cards
- **Font Size**: Small, Medium, or Large text
- **Animations**: Full, Reduced, or None

### Notifications
- **Email Notifications**: Toggle email updates
- **Submission Status**: Notifications for submission reviews
- **Community Activity**: Comments, likes, and interactions
- **Site Updates**: New features and announcements
- **Weekly Digest**: Summary of popular content

### Privacy & Data
- **Public Profile**: Control profile visibility
- **Email Display**: Show/hide email on profile
- **Activity Tracking**: Opt in/out of analytics
- **Data Statistics**: View blocked content and storage usage
- **Data Management**: Download data, clear history, delete account

## File Structure

```
H:\Github\EyesOfAzrael\
├── preferences.html              # Main preferences page
├── css/
│   └── preferences.css           # Preferences page styling
├── js/
│   ├── user-preferences.js       # Data management (existing, enhanced)
│   └── preferences-ui.js         # UI management (NEW)
└── PREFERENCES_PAGE_GUIDE.md     # This documentation
```

## Usage

### Accessing the Preferences Page

Users can access preferences from:
- Dashboard header: "Settings" or "Preferences" button
- User menu dropdown
- Direct URL: `https://eyesofazrael.com/preferences.html`

**Note**: The page requires authentication and will redirect to the login page if no user is logged in.

### Basic Workflow

1. **Navigate to preferences page**
2. **Select desired tab** (Content Filters, Blocked Content, Display, etc.)
3. **Modify settings** - Changes auto-save after 1 second
4. **Manual save** - Click "Save All Changes" for immediate sync
5. **Export/Import** - Backup or restore preferences via JSON files

## Tab Breakdown

### 1. Content Filters Tab

**Purpose**: Control what content appears across the site.

**Features**:
- **Show User-Generated Content**: Master toggle for all user submissions
- **Content Source**:
  - Official Only: Only verified content
  - Official + My Content: Official plus your submissions
  - Everyone: Full wiki experience with all community content
- **Mythology Checkboxes**: Enable/disable entire mythologies
- **Entity Type Checkboxes**: Filter by type (deity, creature, place, etc.)
- **Topic Tags**: Add custom topics/tags to filter out

**Use Cases**:
- Research mode: Official content only
- Personal library: Official + own submissions
- Community exploration: All content from everyone

### 2. Blocked Content Tab

**Purpose**: Manage blocked users, topics, and hidden items.

**Sections**:

#### Blocked Users
- Displays user avatar, name, and block reason
- Unblock button for each user
- "Clear All" option to unblock everyone
- Search/filter functionality (coming soon)

#### Blocked Topics
- Tag-style display of blocked topics
- Add new topics via input field
- Remove individual topics with × button
- "Clear All" option

#### Hidden Submissions
- List of individually hidden content
- Preview information for each item
- Restore button to unhide
- "Clear All" option

### 3. Display Settings Tab

**Purpose**: Customize visual appearance and layout.

**Options**:

#### Theme
- **Dark**: Dark color scheme (default)
- **Light**: Light color scheme
- **Auto**: Matches system preference

#### Layout
- **Grid**: Card-based grid layout
- **List**: Vertical list view
- **Compact**: Dense information display

#### Grid Columns
- Slider from 2-6 columns
- Real-time preview of column count
- Affects grid layout only

#### Card Size
- **Small**: Compact cards with less detail
- **Medium**: Balanced view (default)
- **Large**: Detailed cards with more information

#### Font Size
- **Small**: 14px base
- **Medium**: 16px base (default)
- **Large**: 18px base

#### Animations
- **Full**: All animations enabled
- **Reduced**: Minimal, subtle animations
- **None**: No animations (accessibility)

### 4. Notifications Tab

**Purpose**: Control notification delivery preferences.

**Toggles**:
- **Email Notifications**: Master email toggle
- **Submission Status**: Updates on reviews/approvals
- **Community Activity**: Comments and interactions
- **Site Updates**: Feature announcements
- **Weekly Digest**: Weekly content summary email

### 5. Privacy Tab

**Purpose**: Manage privacy settings and data.

**Privacy Controls**:
- **Public Profile**: Allow others to view profile
- **Show Email**: Display email on public profile
- **Activity Tracking**: Enable personalized recommendations

**Statistics Dashboard**:
- Blocked Users count
- Blocked Topics count
- Hidden Content count
- Storage Used (KB)

**Data Management**:
- **Download My Data**: Export all user data as JSON
- **Clear Browsing History**: Remove recently viewed items
- **Delete Account**: Permanently delete account and data

## Technical Implementation

### Architecture

The preferences system uses a modular architecture:

```
┌─────────────────────────┐
│   preferences.html      │  ← User Interface
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  preferences-ui.js      │  ← UI Management
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  user-preferences.js    │  ← Data Management
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Firebase Firestore     │  ← Cloud Storage
└─────────────────────────┘
```

### Data Storage

**Local Storage**:
- Used for immediate access and offline support
- Syncs with Firestore when online
- Falls back to local if cloud unavailable

**Firestore Collection**: `user_preferences/{userId}`

**Document Structure**:
```javascript
{
  userId: "firebase-auth-uid",
  blockedUsers: ["userId1", "userId2"],
  blockedTopics: ["topic1", "topic2"],
  blockedCategories: ["category1"],
  blockedMythologies: ["mythology1"],
  hiddenSubmissions: ["subId1", "subId2"],
  hiddenTheories: ["theoryId1"],
  displayPreferences: {
    theme: "dark",
    layout: "grid",
    gridSize: 3,
    itemsPerPage: 24,
    showImages: true,
    showIcons: true,
    compactMode: false,
    animationsEnabled: true
  },
  contentFilters: {
    showUserContent: true,
    showTheories: true,
    showSubmissions: true,
    showApprovedOnly: false,
    hideControversial: false,
    minVoteScore: -10
  },
  notificationPreferences: {
    emailNotifications: true,
    notifyOnTheoryComment: true,
    notifyOnSubmissionUpdate: true,
    notifyOnVote: false,
    notifyOnMention: true,
    notifyOnReply: true,
    digestFrequency: "weekly"
  },
  privacySettings: {
    profileVisibility: "public",
    showEmail: false,
    showTheories: true,
    showVotes: false,
    allowMessages: true,
    analyticsOptOut: false
  },
  searchPreferences: {
    defaultSearchScope: ["deities", "heroes", ...],
    searchHistory: true,
    autoComplete: true
  },
  bookmarks: [],
  recentlyViewed: [],
  version: 1,
  createdAt: "2024-12-14T...",
  updatedAt: "2024-12-14T..."
}
```

### Auto-Save System

**Debounced Saving**:
- Changes trigger auto-save after 1 second of inactivity
- Prevents excessive Firestore writes
- Visual indicator shows save status

**Save States**:
- ✓ All changes saved (green)
- ⏳ Saving... (yellow)
- ✗ Error saving (red)

### Sync Mechanism

**On Page Load**:
1. Load preferences from localStorage
2. Check Firebase Auth status
3. If authenticated, sync with Firestore
4. Merge cloud and local (most recent wins)
5. Apply preferences to UI

**On Change**:
1. Update in-memory preferences
2. Save to localStorage immediately
3. Debounce Firestore write (1 second)
4. Update save indicator

## Integration Guide

### Adding Preferences to Dashboard

**In dashboard.html**:
```html
<div class="dashboard-actions">
    <a href="preferences.html" class="btn btn-secondary">
        ⚙️ Preferences
    </a>
</div>
```

### Using Preferences in Your Pages

**Example: Filtering Content**:
```javascript
// Load user preferences
const prefs = window.userPreferences;
await prefs.loadPreferences(currentUser.uid);

// Filter entities
const entities = await fetchEntities();
const filtered = prefs.applyFilters(entities);

// Display filtered content
displayEntities(filtered);
```

**Example: Checking if User is Blocked**:
```javascript
if (userPreferences.isUserBlocked(authorId)) {
    // Don't show content from this user
    return;
}
```

**Example: Applying Theme**:
```javascript
// Theme is auto-applied on preferences load
// Or manually apply:
userPreferences.applyTheme();
```

### Listening for Preference Changes

```javascript
window.addEventListener('preferencesApplied', (event) => {
    const preferences = event.detail;
    // React to preference changes
    reloadContent();
});
```

## API Reference

### UserPreferences Class

#### Core Methods

**`loadPreferences(userId)`**
- Loads user preferences from Firestore
- Returns: `Promise<Object>` - Preferences object
- Uses cache to minimize reads

**`savePreferences()`**
- Saves current preferences to Firestore
- Returns: `Promise<boolean>` - Success status

**`resetToDefaults()`**
- Resets all preferences to default values
- Marks as unsaved changes

**`exportPreferences()`**
- Exports preferences as JSON string
- Returns: `string` - JSON representation

**`importPreferences(json)`**
- Imports preferences from JSON string
- Param: `json` - JSON string
- Returns: `boolean` - Success status

#### Blocking Methods

**`blockUser(userId)`**
- Adds user to blocked list
- Param: `userId` - User ID to block

**`unblockUser(userId)`**
- Removes user from blocked list
- Param: `userId` - User ID to unblock

**`isUserBlocked(userId)`**
- Checks if user is blocked
- Returns: `boolean`

**`blockTopic(topic)`**
- Adds topic to blocked list
- Param: `topic` - Topic/tag to block

**`unblockTopic(topic)`**
- Removes topic from blocked list

**`blockCategory(category)`**
- Blocks an entity type
- Param: `category` - Entity type to block

**`blockMythology(mythology)`**
- Blocks an entire mythology
- Param: `mythology` - Mythology to block

**`hideSubmission(submissionId)`**
- Hides a specific submission
- Param: `submissionId` - Submission ID

**`hideTheory(theoryId)`**
- Hides a specific theory
- Param: `theoryId` - Theory ID

#### Filtering Methods

**`isContentBlocked(entity)`**
- Checks if entity should be blocked
- Param: `entity` - Entity object
- Returns: `boolean`

**`applyFilters(entities)`**
- Filters array of entities
- Param: `entities` - Array of entity objects
- Returns: `Array` - Filtered array

#### Display Methods

**`setDisplayPreference(key, value)`**
- Updates display preference
- Params: `key` - Preference key, `value` - New value

**`getDisplayPreference(key)`**
- Gets display preference value
- Returns: Value of preference

**`applyTheme()`**
- Applies current theme to document

**`applyDisplayPreferences()`**
- Applies all display preferences to UI

#### Notification Methods

**`setNotificationPreference(key, value)`**
- Updates notification preference

**`getNotificationPreference(key)`**
- Gets notification preference

#### Privacy Methods

**`setPrivacySetting(key, value)`**
- Updates privacy setting

**`getPrivacySetting(key)`**
- Gets privacy setting

#### Utility Methods

**`getBlockingStats()`**
- Returns statistics about blocked content
- Returns: `Object` with counts

**`hasUnsavedChanges()`**
- Checks if there are unsaved changes
- Returns: `boolean`

### PreferencesUI Class

#### Core Methods

**`init()`**
- Initializes the preferences UI
- Sets up event listeners
- Loads current preferences

**`switchTab(tabName)`**
- Switches to specified tab
- Param: `tabName` - Tab identifier

#### Population Methods

**`populateMythologyFilters()`**
- Populates mythology checkbox grid

**`populateEntityTypeFilters()`**
- Populates entity type checkbox grid

**`populateBlockedUsers()`**
- Populates blocked users list

**`populateBlockedTopics()`**
- Populates blocked topics chips

**`populateHiddenSubmissions()`**
- Populates hidden submissions list

#### Update Methods

**`updateStatistics()`**
- Updates statistics dashboard

**`updateBlockedCountBadge()`**
- Updates blocked content count badge

**`showSaveSuccess()`**
- Shows save success indicator

#### Action Methods

**`unblockUser(userId)`**
- Unblocks a user and updates UI

**`unblockTopic(topic)`**
- Unblocks a topic and updates UI

**`restoreSubmission(submissionId)`**
- Restores a hidden submission

**`downloadUserData()`**
- Downloads all user data as JSON

**`handleDeleteAccount()`**
- Handles account deletion process

## Troubleshooting

### Common Issues

**Issue**: Preferences not saving
- **Solution**: Check Firebase authentication status
- **Solution**: Verify Firestore security rules allow writes
- **Solution**: Check browser console for errors

**Issue**: Changes not appearing after save
- **Solution**: Reload the page to force preference reapplication
- **Solution**: Clear browser cache
- **Solution**: Check if auto-save is working (save indicator)

**Issue**: Blocked users still appearing
- **Solution**: Ensure content filtering is applied in your page logic
- **Solution**: Call `userPreferences.applyFilters(entities)` on content arrays

**Issue**: Theme not applying
- **Solution**: Check if theme is set to "auto" (follows system)
- **Solution**: Manually call `userPreferences.applyTheme()`
- **Solution**: Verify CSS variables are defined in theme files

**Issue**: Import failing
- **Solution**: Verify JSON file format matches export structure
- **Solution**: Check for valid JSON syntax
- **Solution**: Ensure file is not corrupted

### Debugging

**Enable verbose logging**:
```javascript
// Add to console
window.userPreferences.preferences // View current state
window.userPreferences.hasUnsavedChanges() // Check save status
```

**Monitor Firebase operations**:
```javascript
// Check Firestore read/write operations in browser console
// Look for errors in Network tab
```

**Test preferences locally**:
```javascript
// Export preferences
const exported = window.userPreferences.exportPreferences();
console.log(JSON.parse(exported));

// Import test data
window.userPreferences.importPreferences(testJSON);
```

### Performance Optimization

**Minimize Firestore Reads**:
- Preferences are cached for 5 minutes
- Use `loadPreferences()` once per session
- Rely on localStorage for frequent access

**Minimize Firestore Writes**:
- Auto-save has 1-second debounce
- Batch changes when possible
- Use manual save for critical updates

**Optimize Filters**:
- Apply filters server-side when possible
- Cache filtered results
- Use indexed queries in Firestore

## Best Practices

### For Users

1. **Regular Backups**: Export preferences monthly
2. **Review Blocked Content**: Periodically review blocked users/topics
3. **Manage Storage**: Clear history and hidden items occasionally
4. **Security**: Use strong passwords and enable 2FA

### For Developers

1. **Always Check Authentication**: Verify user is logged in before loading preferences
2. **Handle Missing Preferences**: Use default values as fallback
3. **Validate User Input**: Sanitize topic/tag inputs
4. **Error Handling**: Catch and log all Firestore errors
5. **Event-Driven Updates**: Listen for preference change events
6. **Cache Wisely**: Balance performance with freshness

## Future Enhancements

Planned features for future versions:

- **Search in Blocked Lists**: Filter blocked users/topics
- **Preference Profiles**: Multiple saved preference sets
- **Sharing Preferences**: Share filter configurations
- **Import from URL**: Load preferences from shared link
- **Advanced Analytics**: Detailed usage statistics
- **Recommendation Engine**: AI-powered content suggestions
- **A/B Testing**: Test different layouts and themes
- **Collaborative Filtering**: Discover content based on similar users

## Support

For issues or questions:
- GitHub Issues: [EyesOfAzrael/issues](https://github.com/username/EyesOfAzrael/issues)
- Documentation: This guide
- Developer: Contact site administrator

---

**Version**: 1.0.0
**Last Updated**: December 14, 2024
**Author**: Eyes of Azrael Development Team
