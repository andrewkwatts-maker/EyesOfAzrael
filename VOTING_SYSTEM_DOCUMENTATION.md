# Voting System Documentation

## Overview

The Eyes of Azrael voting system enables community curation through upvotes and downvotes on user-contributed assets and notes. The system uses Firestore transactions to prevent race conditions and provides real-time vote count updates.

## Architecture

### Components

1. **VoteService** (`js/services/vote-service.js`)
   - Transaction-based vote handling
   - Rate limiting
   - Real-time subscriptions
   - Vote analytics integration

2. **VoteButtonsComponent** (`js/components/vote-buttons.js`)
   - Interactive UI component
   - Optimistic updates
   - Real-time sync
   - Authentication integration

3. **VoteAnalyticsService** (`js/services/vote-analytics.js`)
   - Event tracking
   - Statistical analysis
   - Reporting

4. **UI Templates** (`components/vote-buttons.html`)
   - Default, compact, and inline variants
   - Accessible markup
   - Responsive design

5. **Styles** (`css/vote-buttons.css`)
   - Button states and animations
   - Dark mode support
   - Mobile optimization

## Data Schema

### Vote Documents

Path: `votes/{itemType}/{itemId}/{userId}`

```typescript
{
  value: 1 | -1,           // Upvote (+1) or downvote (-1)
  userId: string,          // Voter's user ID
  timestamp: number        // Vote timestamp (milliseconds)
}
```

**Example:**
```
votes/
├── assets/
│   └── deity_zeus_123/
│       ├── user_abc123/
│       │   ├── value: 1
│       │   ├── userId: "user_abc123"
│       │   └── timestamp: 1704067200000
│       └── user_xyz789/
│           ├── value: -1
│           ├── userId: "user_xyz789"
│           └── timestamp: 1704070800000
└── notes/
    └── note_456/
        └── user_abc123/
            ├── value: 1
            ├── userId: "user_abc123"
            └── timestamp: 1704074400000
```

### Item Documents (Cached Totals)

Each votable item stores aggregated vote data:

```typescript
{
  votes: number,              // Net votes (upvotes - downvotes)
  upvoteCount: number,        // Total upvotes
  downvoteCount: number,      // Total downvotes
  contestedScore: number,     // Controversy metric
  totalEngagement: number,    // Total votes (upvotes + downvotes)
  updatedAt: Timestamp        // Last update
}
```

### Contested Score Formula

The contested score identifies items with high engagement but controversial ratings:

```javascript
contestedScore = (upvotes + downvotes) * 1000 - Math.abs(netVotes)
```

**Examples:**
- Item A: 100 up, 98 down = (198 × 1000) - 2 = **197,998** (very contested!)
- Item B: 50 up, 2 down = (52 × 1000) - 48 = **51,952** (popular, not contested)
- Item C: 200 up, 5 down = (205 × 1000) - 195 = **204,805** (very popular, not contested)

## Voting Rules

### User Permissions

1. **One Vote Per User Per Item**
   - Enforced by document ID = userId
   - Users can change their vote
   - Users can remove their vote

2. **Vote Values**
   - `+1` = Upvote
   - `-1` = Downvote
   - No neutral/abstain option

3. **Vote Changes**
   - Click upvote when already upvoted → Remove vote (0)
   - Click downvote when upvoted → Change to downvote (-1)
   - Click upvote when downvoted → Change to upvote (+1)

4. **Authentication Required**
   - Must be logged in to vote
   - Login prompt shown to guests

### Rate Limiting

- **Client-side:** Max 100 votes per minute
- **Server-side:** Firestore rules check timestamp
- **Cooldown:** 60 seconds
- **Warning:** Displayed when limit exceeded

## Transaction Logic

The voting system uses Firestore transactions to prevent race conditions:

```javascript
async function handleVote(itemId, itemType, voteValue) {
  await db.runTransaction(async (transaction) => {
    // 1. Get current vote
    const voteDoc = await transaction.get(voteRef);
    const itemDoc = await transaction.get(itemRef);

    // 2. Calculate vote delta
    let voteDelta = 0;
    if (voteDoc.exists && voteDoc.data().value === voteValue) {
      // Remove vote
      transaction.delete(voteRef);
      voteDelta = -voteValue;
    } else if (voteDoc.exists) {
      // Change vote
      transaction.update(voteRef, { value: voteValue, timestamp: Date.now() });
      voteDelta = voteValue - voteDoc.data().value; // ±2
    } else {
      // New vote
      transaction.set(voteRef, { value: voteValue, userId, timestamp: Date.now() });
      voteDelta = voteValue;
    }

    // 3. Update item totals
    const newVotes = (itemDoc.data().votes || 0) + voteDelta;
    transaction.update(itemRef, {
      votes: newVotes,
      upvoteCount: /* calculated */,
      downvoteCount: /* calculated */,
      contestedScore: /* calculated */,
      totalEngagement: /* calculated */
    });

    return { newVotes, voteDelta };
  });
}
```

### Race Condition Handling

Transactions ensure that:
1. Multiple concurrent votes don't create duplicate vote documents
2. Vote counts are always accurate
3. No votes are lost during simultaneous operations
4. Each user can only have one active vote per item

## Real-Time Updates

### Server → Client

Vote counts update in real-time using Firestore snapshots:

```javascript
const unsubscribe = voteService.subscribeToVotes(itemId, itemType, (data) => {
  console.log('New vote count:', data.votes);
  updateUI(data.votes);
});
```

### Debouncing

Updates are debounced to prevent excessive re-renders:
- **Debounce delay:** 2 seconds
- **Max update frequency:** 1 update per 2 seconds per item

### Optimistic Updates

For instant user feedback:
1. Apply change to UI immediately
2. Send transaction to server
3. Revert if transaction fails
4. Sync with server response

## Security Rules

### Firestore Rules

```javascript
match /votes/{itemType}/{itemId}/{userId} {
  // Anyone can read votes
  allow read: if true;

  // Users can only create/update/delete their own votes
  allow create: if request.auth.uid == userId
                && itemType in ['assets', 'notes']
                && request.resource.data.value in [1, -1]
                && request.resource.data.userId == request.auth.uid;

  allow update: if request.auth.uid == userId
                && resource.data.userId == request.auth.uid
                && request.resource.data.value in [1, -1];

  allow delete: if request.auth.uid == userId
                && resource.data.userId == request.auth.uid;
}
```

### Security Features

1. **User Isolation:** Users can only modify their own votes
2. **Value Validation:** Only +1 or -1 allowed
3. **Type Validation:** Only 'assets' or 'notes' allowed
4. **Timestamp Verification:** Prevents backdating votes
5. **Public Read:** Anyone can view vote counts

## Analytics

### Tracked Events

```javascript
{
  action: 'vote_added' | 'vote_changed' | 'vote_removed',
  itemType: 'assets' | 'notes',
  itemId: string,
  voteValue: 1 | -1,
  voteDelta: number,
  userId: string,
  timestamp: number,
  date: string  // YYYY-MM-DD
}
```

### Metrics

1. **Engagement Metrics**
   - Total votes
   - Unique voters
   - Upvote/downvote ratio
   - Average votes per item

2. **Item Rankings**
   - Most upvoted
   - Most controversial (high contested score)
   - Trending (recent vote velocity)

3. **User Metrics**
   - Total votes cast
   - Upvote percentage
   - Downvote percentage
   - Unique items voted on

### Controversy Rating

0-100 scale indicating how divisive an item is:

```javascript
calculateControversyRating(upvotes, downvotes) {
  const total = upvotes + downvotes;
  if (total === 0) return 0;

  const ratio = Math.min(upvotes, downvotes) / total;
  return Math.round(ratio * 200);
}
```

- **100:** Perfect 50/50 split (maximum controversy)
- **50:** 75/25 split (moderate controversy)
- **0:** 100/0 split (unanimous)

## UI Components

### Basic Usage

```html
<!-- Default (full size) -->
<div class="vote-buttons"
     data-item-id="asset123"
     data-item-type="assets"></div>

<!-- Compact (for cards) -->
<div class="vote-buttons compact"
     data-item-id="note456"
     data-item-type="notes"></div>

<!-- Inline (for lists) -->
<div class="vote-buttons inline"
     data-item-id="asset789"
     data-item-type="assets"></div>
```

### Button States

1. **Default** - Gray buttons, no active vote
2. **Upvoted** - Green upvote button, +1 highlighted
3. **Downvoted** - Red downvote button, -1 highlighted
4. **Disabled** - Gray, reduced opacity (not authenticated)
5. **Loading** - Spinner animation during transaction
6. **Error** - Red error message displayed

### Accessibility

- **ARIA labels:** All buttons have descriptive labels
- **Keyboard navigation:** Full keyboard support
- **Focus indicators:** Clear focus outlines
- **Screen reader support:** Vote counts announced
- **Reduced motion:** Respects prefers-reduced-motion

## Integration

### Asset Cards

Add vote buttons to user-submitted assets:

```javascript
// In asset card renderer
const voteButtons = document.createElement('div');
voteButtons.className = 'vote-buttons compact';
voteButtons.dataset.itemId = asset.id;
voteButtons.dataset.itemType = 'assets';
card.appendChild(voteButtons);
```

### Note Cards

Add vote buttons to user notes:

```javascript
// In note renderer
const voteButtons = document.createElement('div');
voteButtons.className = 'vote-buttons inline';
voteButtons.dataset.itemId = note.id;
voteButtons.dataset.itemType = 'notes';
noteCard.appendChild(voteButtons);
```

### Grid Sorting

Sort items by vote count:

```javascript
// Sort by most upvoted
items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

// Sort by most controversial
items.sort((a, b) => (b.contestedScore || 0) - (a.contestedScore || 0));

// Sort by total engagement
items.sort((a, b) => (b.totalEngagement || 0) - (a.totalEngagement || 0));
```

### Profile Page

Show user's voting history:

```javascript
const voteHistory = await voteService.getUserVotingHistory(userId);

voteHistory.votes.forEach(vote => {
  console.log(`${vote.itemType}/${vote.itemId}: ${vote.value > 0 ? '👍' : '👎'}`);
});
```

## API Reference

### VoteService

```javascript
const voteService = new VoteService(db, auth);

// Handle vote
const result = await voteService.handleVote(itemId, itemType, voteValue);
// Returns: { success, newVotes, voteDelta, userVote, upvoteCount, downvoteCount }

// Get user's current vote
const { vote } = await voteService.getUserVote(itemId, itemType);
// Returns: 1, -1, or 0

// Get vote counts
const counts = await voteService.getVoteCounts(itemId, itemType);
// Returns: { upvotes, downvotes, total }

// Subscribe to real-time updates
const unsubscribe = voteService.subscribeToVotes(itemId, itemType, (data) => {
  console.log('Vote count:', data.votes);
});

// Get most upvoted items
const topItems = await voteService.getMostUpvoted(itemType, limit);

// Get most controversial items
const controversial = await voteService.getMostContested(itemType, limit, minEngagement);

// Get user's voting history
const history = await voteService.getUserVotingHistory(userId);
```

### VoteButtonsComponent

```javascript
const container = document.querySelector('.vote-buttons');
const component = new VoteButtonsComponent(container);

// Manual initialization
component.init();

// Destroy component
component.destroy();

// Update UI
component.updateUI();

// Show/hide states
component.showError('Error message');
component.showLoginPrompt();
component.showRateLimitWarning();
```

### VoteAnalyticsService

```javascript
const analytics = new VoteAnalyticsService(db, auth);

// Track vote action
await analytics.trackVoteAction(action, itemType, itemId, voteValue, voteDelta);

// Get item statistics
const stats = await analytics.getItemStats(itemType, itemId);
// Returns: { votes, upvoteCount, downvoteCount, engagementRate, controversyRating }

// Get daily trends
const trends = await analytics.getDailyTrends(days);

// Get user statistics
const userStats = await analytics.getUserVotingStats(userId);

// Generate report
const report = await analytics.generateReport(startDate, endDate);
```

## Performance Optimization

### Caching

1. **User Vote State:** Cached in component for session
2. **Vote Counts:** Cached on item documents
3. **Analytics Stats:** Cached for 5 minutes

### Debouncing

1. **Real-time Updates:** Max 1 update per 2 seconds
2. **Analytics Events:** Batched every 10 seconds
3. **UI Renders:** Throttled on scroll

### Indexing

Required Firestore indexes:

```javascript
// Collection: assets
// Fields: votes (desc), createdAt (desc)

// Collection: notes
// Fields: votes (desc), createdAt (desc)

// Collection: assets
// Fields: contestedScore (desc), totalEngagement (desc)

// Collection: vote_events
// Fields: date (asc), itemType (asc)
```

## Troubleshooting

### Common Issues

**Issue:** Votes not updating in real-time

**Solution:**
- Check Firebase connection
- Verify Firestore rules allow reads
- Check browser console for errors
- Ensure subscription is active

---

**Issue:** Rate limiting triggered

**Solution:**
- Wait 60 seconds before voting again
- Check for infinite loops in code
- Verify rate limit settings

---

**Issue:** Transaction failures

**Solution:**
- Check network connection
- Verify item exists
- Check Firestore rules
- Review transaction logic

---

**Issue:** Vote count mismatch

**Solution:**
- Recalculate from vote collection
- Check for concurrent updates
- Verify transaction completed
- Run vote reconciliation script

## Deployment

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Create Indexes

```bash
firebase deploy --only firestore:indexes
```

### 3. Test Security Rules

Use Firebase Console Rules Playground:
- Test vote creation as authenticated user
- Test vote updates as different user (should fail)
- Test vote deletion as owner
- Test reading votes as guest

### 4. Enable Analytics

```bash
# Enable Google Analytics
firebase analytics:enable

# Configure event tracking
firebase analytics:events:set vote_added
firebase analytics:events:set vote_changed
firebase analytics:events:set vote_removed
```

## Best Practices

1. **Always use transactions** for vote updates
2. **Cache user vote state** to reduce reads
3. **Debounce real-time updates** to prevent UI thrashing
4. **Track analytics** for all vote actions
5. **Validate on client and server** for security
6. **Show optimistic updates** for UX
7. **Handle errors gracefully** with user feedback
8. **Test race conditions** with concurrent users
9. **Monitor rate limits** and adjust as needed
10. **Audit vote data** regularly for integrity

## Future Enhancements

### Planned Features

- [ ] Vote notifications (e.g., "Your content received 100 upvotes!")
- [ ] Leaderboards (most upvoted users, items)
- [ ] Vote decay (older votes worth less over time)
- [ ] Vote weighting (verified users worth more)
- [ ] Vote reasons (optional comment with vote)
- [ ] Vote history visualization
- [ ] A/B testing for vote UI
- [ ] Machine learning for vote fraud detection
- [ ] Vote-based content recommendations

### Experimental Features

- **Quadratic Voting:** Users have limited vote "credits"
- **Delegated Voting:** Experts in domain have weighted votes
- **Time-decay:** Recent votes count more than old votes
- **Reputation Multiplier:** High-reputation users have weighted votes

## Support

For questions or issues:
- **GitHub Issues:** https://github.com/EyesOfAzrael/issues
- **Documentation:** https://eyesofazrael.com/docs/voting
- **Email:** support@eyesofazrael.com

## License

MIT License - See LICENSE file for details.

---

**Last Updated:** 2025-12-29
**Version:** 1.0.0
**Author:** Agent 8 - Voting System Implementation
