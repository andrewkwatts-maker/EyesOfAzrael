# User Interaction System - Master Plan
**Date**: December 29, 2025
**Version**: 3.0.0
**Status**: Implementation Plan

## Executive Summary

Comprehensive plan to transform Eyes of Azrael from a static encyclopedia into a **collaborative mythology platform** with user-generated content, voting, and community curation.

## System Architecture

### Content Types

#### 1. Standard Assets (Official Content)
- **Source**: Curated by site administrators
- **Display**: Default visible to all users
- **User Actions**:
  - ✅ Read-only viewing
  - ✅ Add notes/annotations (stored separately)
  - ✅ Submit edit suggestions (reviewed by admins)
  - ❌ Cannot directly edit or delete

#### 2. User-Submitted Assets
- **Source**: Created by authenticated users
- **Display**: Hidden by default, opt-in visibility
- **User Actions**:
  - ✅ Full CRUD for asset owner
  - ✅ Edit icons visible to owner
  - ✅ Upvote/downvote by all users
  - ✅ Can be deleted by owner or admins

#### 3. User Notes (on Standard Assets)
- **Source**: Annotations by authenticated users
- **Display**: Shown on standard asset pages (opt-in)
- **User Actions**:
  - ✅ Add/edit/delete own notes
  - ✅ Upvote/downvote others' notes
  - ✅ Sorted by vote count

## Firebase Schema Design

### Collections Structure

```
firestore/
├── standard_assets/          # Official curated content
│   ├── deities/
│   ├── creatures/
│   ├── heroes/
│   └── [other types]/
│
├── user_assets/              # User-generated content
│   ├── {userId}/
│   │   ├── deities/
│   │   │   └── {assetId}
│   │   │       ├── id: string
│   │   │       ├── name: string
│   │   │       ├── type: "deity"
│   │   │       ├── mythology: string
│   │   │       ├── createdAt: timestamp
│   │   │       ├── updatedAt: timestamp
│   │   │       ├── isPublic: boolean
│   │   │       ├── votes: number (cached total)
│   │   │       └── [content fields...]
│   │   └── [other types]/
│   └── [other users]/
│
├── user_notes/               # Annotations on standard assets
│   ├── {assetType}/
│   │   └── {assetId}/
│   │       └── notes/
│   │           └── {noteId}
│   │               ├── userId: string
│   │               ├── userName: string
│   │               ├── content: string
│   │               ├── createdAt: timestamp
│   │               ├── updatedAt: timestamp
│   │               ├── votes: number (cached)
│   │               └── isEdited: boolean
│
├── votes/                    # Vote tracking
│   ├── assets/
│   │   └── {assetId}/
│   │       └── {userId}
│   │           ├── value: 1 | -1
│   │           ├── timestamp: timestamp
│   │           └── userId: string
│   └── notes/
│       └── {noteId}/
│           └── {userId}
│               ├── value: 1 | -1
│               └── timestamp: timestamp
│
├── edit_suggestions/         # Proposed edits to standard assets
│   └── {assetId}/
│       └── {suggestionId}
│           ├── userId: string
│           ├── userName: string
│           ├── assetType: string
│           ├── assetId: string
│           ├── changes: object
│           ├── reason: string
│           ├── status: "pending" | "approved" | "rejected"
│           ├── createdAt: timestamp
│           └── reviewedAt: timestamp | null
│
└── user_preferences/         # User settings
    └── {userId}
        ├── showUserContent: boolean (default: false)
        ├── showUserNotes: boolean (default: true)
        ├── contentSortOrder: "votes" | "recent" | "contested"
        └── updatedAt: timestamp
```

### Vote Counting Logic

**Total Votes Calculation**:
```javascript
totalVotes = upvoteCount - downvoteCount

upvoteCount = count(WHERE value = 1 AND userId is unique)
downvoteCount = count(WHERE value = -1 AND userId is unique)
```

**Sorting Modes**:
1. **Most Votes**: `ORDER BY votes DESC`
2. **Least Votes**: `ORDER BY votes ASC`
3. **Most Contested**: `ORDER BY (upvoteCount + downvoteCount) DESC, ABS(votes) ASC`
   - Items with most total engagement (votes cast) but close to 0 net votes

## UI Components

### 1. Grid View Enhancements

#### Add Asset Button
```html
<div class="grid-header">
  <h2>Deities - Greek Mythology</h2>

  <!-- Admin/User Add Button -->
  <button class="add-asset-btn" id="add-deity-btn">
    <svg><!-- Plus icon --></svg>
    Add New Deity
  </button>

  <!-- Content Filter Toggle -->
  <div class="content-filter">
    <label>
      <input type="checkbox" id="show-user-content" />
      Show Community Content
    </label>
  </div>
</div>
```

#### Asset Card with User Indicators
```html
<div class="entity-card" data-asset-type="user" data-owner-id="user123">
  <!-- User Asset Badge -->
  <span class="user-content-badge">Community</span>

  <!-- Edit Icons (only for owner) -->
  <div class="asset-actions owner-only">
    <button class="edit-btn" title="Edit">✏️</button>
    <button class="delete-btn" title="Delete">🗑️</button>
  </div>

  <!-- Vote Buttons -->
  <div class="vote-section">
    <button class="upvote-btn" data-voted="false">⬆️</button>
    <span class="vote-count">+42</span>
    <button class="downvote-btn" data-voted="false">⬇️</button>
  </div>

  <!-- Asset Content -->
  <img src="..." class="entity-icon" />
  <h3>Zeus (Community Version)</h3>
  <p class="entity-mythology">Greek</p>
  <p class="entity-author">by @HistoryBuff23</p>
</div>
```

### 2. Entity Detail Page Enhancements

#### User Notes Section
```html
<section class="user-notes-section">
  <div class="section-header">
    <h3>Community Notes & Insights</h3>
    <button class="add-note-btn">Add Your Note</button>
  </div>

  <!-- Sort Controls -->
  <div class="notes-sort">
    <select id="notes-sort-order">
      <option value="votes">Most Helpful</option>
      <option value="recent">Most Recent</option>
      <option value="contested">Most Debated</option>
    </select>
  </div>

  <!-- Notes List -->
  <div class="notes-list">
    <div class="note-card" data-note-id="note123">
      <div class="note-header">
        <img src="..." class="author-avatar" />
        <div class="author-info">
          <span class="author-name">@MythologyExpert</span>
          <span class="note-date">2 days ago</span>
        </div>
      </div>

      <div class="note-content">
        <p>Interesting connection to Egyptian mythology...</p>
      </div>

      <div class="note-actions">
        <div class="vote-buttons">
          <button class="upvote-btn">👍 <span>127</span></button>
          <button class="downvote-btn">👎 <span>5</span></button>
        </div>

        <!-- Owner Actions -->
        <div class="owner-actions owner-only">
          <button class="edit-note-btn">Edit</button>
          <button class="delete-note-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### Edit Suggestion Button (Standard Assets)
```html
<div class="asset-edit-section">
  <button class="suggest-edit-btn">
    <svg><!-- Edit icon --></svg>
    Suggest an Edit
  </button>
</div>
```

### 3. Asset Creation/Edit Modal

```html
<div class="modal" id="asset-editor-modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Add New Deity</h2>
      <button class="close-modal">&times;</button>
    </div>

    <form id="asset-form" class="asset-form">
      <!-- Basic Fields -->
      <div class="form-group">
        <label>Name *</label>
        <input type="text" name="name" required />
      </div>

      <div class="form-group">
        <label>Mythology *</label>
        <select name="mythology" required>
          <option value="greek">Greek</option>
          <option value="norse">Norse</option>
          <!-- ... -->
        </select>
      </div>

      <div class="form-group">
        <label>Description *</label>
        <textarea name="description" rows="6" required></textarea>
      </div>

      <!-- Type-Specific Fields (Dynamic) -->
      <div id="dynamic-fields">
        <!-- Deity-specific: domains, symbols, etc. -->
        <!-- Creature-specific: habitat, behavior, etc. -->
      </div>

      <!-- Visibility -->
      <div class="form-group">
        <label>
          <input type="checkbox" name="isPublic" checked />
          Make this publicly visible
        </label>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-submit">
          <span id="submit-text">Create Deity</span>
        </button>
      </div>
    </form>
  </div>
</div>
```

## Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    // Standard assets - Read-only for users
    match /standard_assets/{assetType}/{assetId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User assets - Full control for owner
    match /user_assets/{userId}/{assetType}/{assetId} {
      allow read: if resource.data.isPublic == true || isOwner(userId) || isAdmin();
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isOwner(userId) || isAdmin();
    }

    // User notes
    match /user_notes/{assetType}/{assetId}/notes/{noteId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Votes - One vote per user per item
    match /votes/{voteType}/{itemId}/{userId} {
      allow read: if true;
      allow write: if isSignedIn() && isOwner(userId);
    }

    // Edit suggestions
    match /edit_suggestions/{assetId}/{suggestionId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isAdmin(); // Only admins can approve/reject
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // User preferences
    match /user_preferences/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

## Feature Specifications

### Feature 1: Add Asset Button

**Requirements**:
- Appears on all grid/browse views
- Opens asset creation modal
- Pre-fills asset type and mythology from current context
- Validates required fields before submission
- Saves to `user_assets/{userId}/{type}/{generatedId}`
- Shows success notification with link to new asset

**Edge Cases**:
- User not authenticated → Show login prompt
- Duplicate name → Show warning, allow anyway (user content)
- Network error → Save draft to localStorage, retry later

### Feature 2: Edit Icons on User Assets

**Requirements**:
- Only visible to asset owner (check `request.auth.uid == asset.userId`)
- Edit button → Opens asset in edit modal
- Delete button → Confirms, then soft-deletes asset
- Shows "Community Content" badge on cards
- Displays author username/avatar

**Edge Cases**:
- Asset deleted → Show placeholder "Content removed by author"
- User changes username → Update denormalized userName field

### Feature 3: User Notes System

**Requirements**:
- "Add Note" button on all standard asset pages
- Opens rich text editor (supports markdown)
- Saves to `user_notes/{assetType}/{assetId}/notes/{noteId}`
- Sorts by votes (default), recent, or contested
- Edit/delete only for note owner
- Character limit: 2000 characters

**Edge Cases**:
- Asset doesn't exist → Create notes collection anyway
- User deletes account → Anonymize notes ("Deleted User")
- Spam detection → Flag notes with excessive downvotes

### Feature 4: Voting System

**Requirements**:
- Upvote/downvote buttons on user assets and notes
- One vote per user per item (stored in `/votes/{type}/{itemId}/{userId}`)
- Can change vote (upvote → downvote or vice versa)
- Can remove vote (click same button again)
- Real-time vote count updates
- Vote totals denormalized to asset/note for performance

**Implementation**:
```javascript
async function handleVote(itemId, itemType, voteValue) {
  const userId = auth.currentUser.uid;
  const voteRef = db.doc(`votes/${itemType}/${itemId}/${userId}`);
  const itemRef = db.doc(`${itemType}/${itemId}`);

  await db.runTransaction(async (transaction) => {
    const voteDoc = await transaction.get(voteRef);
    const itemDoc = await transaction.get(itemRef);

    let voteDelta = voteValue; // 1 or -1

    if (voteDoc.exists) {
      const oldVote = voteDoc.data().value;
      if (oldVote === voteValue) {
        // Remove vote
        transaction.delete(voteRef);
        voteDelta = -voteValue;
      } else {
        // Change vote
        transaction.update(voteRef, { value: voteValue, timestamp: Date.now() });
        voteDelta = voteValue - oldVote; // Could be +2 or -2
      }
    } else {
      // New vote
      transaction.set(voteRef, {
        value: voteValue,
        userId,
        timestamp: Date.now()
      });
    }

    // Update cached total
    const newTotal = (itemDoc.data().votes || 0) + voteDelta;
    transaction.update(itemRef, { votes: newTotal });
  });
}
```

### Feature 5: Content Filtering

**Requirements**:
- Toggle: "Show Community Content" (default: OFF)
- Persists to `user_preferences/{userId}/showUserContent`
- When enabled, mixes user assets with standard assets
- User assets clearly labeled with badge
- Sorting applies to combined list

**UI**:
```html
<div class="content-filter-bar">
  <label class="toggle-switch">
    <input type="checkbox" id="show-community-content" />
    <span class="slider"></span>
    <span class="label">Show Community Content</span>
  </label>

  <span class="count-badge">+47 community items</span>
</div>
```

### Feature 6: Ordering Modes

**Most Votes** (Default):
```javascript
query.orderBy('votes', 'desc')
```

**Least Votes**:
```javascript
query.orderBy('votes', 'asc')
```

**Most Contested** (Complex):
```javascript
// Firestore doesn't support computed fields in queries
// Solution: Compute contestedScore on write

// On vote change:
contestedScore = (upvoteCount + downvoteCount) * 1000 - Math.abs(totalVotes)

// Query:
query.orderBy('contestedScore', 'desc')
```

## Implementation Phases

### Phase 1: Core CRUD (Agents 1-5)
1. Fix critical data issues
2. Repair broken links
3. Deploy icon system
4. Complete deity enhancements
5. Add family trees

### Phase 2: User Asset System (Agent 6)
1. Firestore schema setup
2. Asset creation modal
3. Add buttons on grids
4. Save to user_assets collection
5. Basic validation

### Phase 3: User Notes System (Agent 7)
1. Notes UI component
2. Note creation/editing
3. Display notes on asset pages
4. Owner edit/delete

### Phase 4: Voting System (Agent 8)
1. Vote buttons component
2. Transaction-based voting
3. Vote count display
4. User vote state tracking
5. Real-time updates

### Phase 5: Content Filtering (Agent 9)
1. User preferences storage
2. Toggle UI component
3. Query logic for mixed content
4. Badge system for user content

### Phase 6: Ordering & Polish (Agents 10-12)
1. Sort mode selector
2. Contested score calculation
3. Grid view polish
4. Final integration testing
5. Public release prep

## Performance Considerations

### Query Optimization
- Index on `votes` field for all collections
- Composite index: `(mythology, votes)` for filtered sorts
- Denormalize vote counts to avoid real-time aggregation
- Paginate results (25 items per page)

### Caching Strategy
- Cache standard assets (rarely change)
- Cache vote totals (update every 5 seconds max)
- Invalidate user asset cache on edit
- Use Firestore onSnapshot for real-time votes

### Security
- Rate limiting on vote endpoints (max 100 votes/minute)
- Spam detection on note creation (max 10 notes/hour)
- Content moderation queue for reported items
- Honeypot fields on forms to catch bots

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User asset creation rate | 50+ per week | Analytics event tracking |
| Note engagement rate | 30% of viewers add notes | Firestore count queries |
| Average votes per asset | 10+ votes | Vote count aggregation |
| Community content usage | 20% enable toggle | User preferences analysis |
| Edit suggestion quality | 50% approval rate | Admin review stats |

## Deployment Checklist

- [ ] Firestore security rules deployed
- [ ] Indexes created for all query patterns
- [ ] User preferences collection initialized
- [ ] Vote transaction functions tested
- [ ] Modal components styled and responsive
- [ ] Add buttons visible on all grids
- [ ] Edit icons show only for owners
- [ ] Content filter toggle working
- [ ] Sort modes all functional
- [ ] Real-time vote updates working
- [ ] Spam protection active
- [ ] Admin moderation dashboard ready
- [ ] Analytics events configured
- [ ] User documentation created
- [ ] Public announcement prepared

---

**Status**: Ready for Agent Deployment
**Estimated Implementation Time**: 40-60 hours (12 agents × 3-5 hours each)
**Target Completion**: January 3-5, 2026
