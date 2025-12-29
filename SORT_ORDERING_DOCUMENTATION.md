# Sort Ordering System Documentation

## Overview

The Sort Ordering System enables users to sort community content by different vote-based and metadata criteria. This provides flexible content discovery and helps users find the most helpful, controversial, or recent content.

## Features

### 1. Sort Options

#### Most Helpful (votes-desc)
- **Description**: Shows content with the highest net votes first
- **Formula**: `upvotes - downvotes` (descending order)
- **Use Case**: Find the most valued content by the community
- **Query**: `orderBy('votes', 'desc')`

#### Least Helpful (votes-asc)
- **Description**: Shows content with the lowest votes first (including negative)
- **Formula**: `upvotes - downvotes` (ascending order)
- **Use Case**: Identify content that needs improvement or review
- **Query**: `orderBy('votes', 'asc')`

#### Most Debated (contested)
- **Description**: Shows items with high engagement but close net scores
- **Formula**: `(upvotes + downvotes) * 1000 - Math.abs(netVotes)`
- **Use Case**: Find content where the community can't agree on quality
- **Query**: `where('totalEngagement', '>=', 10).orderBy('contestedScore', 'desc')`

**Contested Score Examples**:
- Item A: 100 upvotes, 98 downvotes
  - Net votes: 2
  - Total engagement: 198
  - Contested score: `(198 * 1000) - 2 = 197,998` ✅ Very contested!

- Item B: 50 upvotes, 2 downvotes
  - Net votes: 48
  - Total engagement: 52
  - Contested score: `(52 * 1000) - 48 = 51,952` ❌ Not contested

- Item C: 200 upvotes, 5 downvotes
  - Net votes: 195
  - Total engagement: 205
  - Contested score: `(205 * 1000) - 195 = 204,805` ❌ Popular, not contested

#### Most Recent (recent)
- **Description**: Shows newest content first
- **Formula**: Sort by creation date (descending)
- **Use Case**: Discover new submissions
- **Query**: `orderBy('createdAt', 'desc')`

#### Alphabetical (alphabetical)
- **Description**: Sort alphabetically by name
- **Formula**: Sort by name (ascending)
- **Use Case**: Browse content in alphabetical order
- **Query**: `orderBy('name', 'asc')`

---

## Data Model

### Vote Fields on Items

All voteable items (assets, notes, theories) include these fields:

```javascript
{
  // Legacy field (maintained for backwards compatibility)
  votes: number,              // Net votes: upvotes - downvotes

  // New fields for enhanced sorting
  upvoteCount: number,        // Total upvotes
  downvoteCount: number,      // Total downvotes
  contestedScore: number,     // Calculated contested score
  totalEngagement: number,    // upvotes + downvotes

  // Metadata
  createdAt: timestamp,       // Creation date
  lastVotedAt: timestamp,     // Last vote timestamp
  updatedAt: timestamp        // Last update
}
```

### Vote Records

Individual votes stored in `votes/{itemType}/{itemId}/{userId}`:

```javascript
{
  value: 1 | -1,             // 1 for upvote, -1 for downvote
  userId: string,            // User who voted
  timestamp: number,         // Vote timestamp
  userName: string,          // Display name (optional)
  userEmail: string          // Email (optional)
}
```

---

## Architecture

### Components

#### 1. VoteService (`js/services/vote-service.js`)
Handles all voting operations with transaction-based safety:

```javascript
const voteService = new VoteService(firestore, auth);

// Cast a vote
await voteService.handleVote(itemId, 'assets', 1); // Upvote
await voteService.handleVote(itemId, 'notes', -1); // Downvote

// Get contested items
const { items } = await voteService.getMostContested('assets', 10);

// Calculate contested score
const score = voteService.calculateContestedScore(100, 98);
console.log(score); // 197,998
```

**Key Methods**:
- `handleVote(itemId, itemType, voteValue)` - Cast/change/remove vote
- `calculateContestedScore(upvotes, downvotes)` - Calculate contested score
- `getMostContested(itemType, limit, minEngagement)` - Query contested items
- `getUserVote(itemId, itemType)` - Get user's current vote
- `getVoteStats(itemId, itemType)` - Get vote statistics

#### 2. SortSelector Component (`js/components/sort-selector.js`)
UI component for sort selection:

```javascript
const sortSelector = new SortSelector(container, {
  defaultSort: 'votes-desc',
  onSortChange: (sortBy) => {
    console.log('Sort changed:', sortBy);
    reloadContent(sortBy);
  }
});
```

**Features**:
- Persistent preferences (localStorage + Firestore)
- Debounced sort changes (300ms default)
- Tooltips explaining each sort method
- Analytics tracking
- Responsive design
- Keyboard accessibility

#### 3. Firestore Indexes
Composite indexes for efficient queries (see `firestore.indexes.json`):

**Per collection** (deities, creatures, heroes, items, places, rituals, texts, symbols, herbs, cosmology):
- `mythology ASC + votes DESC` (most helpful)
- `mythology ASC + votes ASC` (least helpful)
- `mythology ASC + contestedScore DESC` (most debated)

**For user content** (user_assets, user_notes):
- `totalEngagement ASC + contestedScore DESC` (contested items with minimum engagement)

---

## Implementation Guide

### Step 1: Add Sort Selector to Page

```html
<!-- In your HTML -->
<div class="browse-controls">
  <div id="sortSelectorContainer"></div>
</div>

<script>
  // Initialize sort selector
  const container = document.getElementById('sortSelectorContainer');
  const sortSelector = new SortSelector(container, {
    defaultSort: 'votes-desc',
    onSortChange: async (sortBy) => {
      await loadContent(sortBy);
    }
  });
</script>
```

### Step 2: Implement Sort Logic

```javascript
async function loadContent(sortBy) {
  let query = db.collection('deities');

  switch (sortBy) {
    case 'votes-desc':
      query = query.orderBy('votes', 'desc');
      break;
    case 'votes-asc':
      query = query.orderBy('votes', 'asc');
      break;
    case 'contested':
      query = query
        .where('totalEngagement', '>=', 10)
        .orderBy('contestedScore', 'desc');
      break;
    case 'recent':
      query = query.orderBy('createdAt', 'desc');
      break;
    case 'alphabetical':
      query = query.orderBy('name', 'asc');
      break;
  }

  const snapshot = await query.limit(25).get();
  displayResults(snapshot.docs);
}
```

### Step 3: Deploy Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Monitor index creation (can take several minutes)
# Check Firebase Console > Firestore > Indexes
```

### Step 4: Migrate Existing Data (Optional)

If you have existing items without vote fields:

```javascript
const voteService = new VoteService(db, auth);

// Update all items in a collection
await voteService.batchUpdateVoteMetrics('assets', 100);
await voteService.batchUpdateVoteMetrics('notes', 100);
```

---

## UI/UX Guidelines

### Sort Selector Placement

**Recommended locations**:
1. **Browse pages**: Next to view toggle (grid/list)
2. **Category indexes**: Above entity grid
3. **Search results**: In filter toolbar
4. **User profiles**: For user's contributions

**DO NOT place**:
- On detail pages (single entity view)
- On static content pages
- In navigation headers

### Tooltip Content

The sort selector includes helpful tooltips:

```
Most Helpful: Items with the highest net votes
Least Helpful: Items with the lowest votes (including negative)
Most Debated: High engagement but close scores - community can't agree!
Most Recent: Newest submissions shown first
A-Z: Alphabetical order by name
```

### Contested Content Badge

Add a badge to highly contested items:

```javascript
function getContestedBadge(entity) {
  const isContested = entity.contestedScore > 100000 && Math.abs(entity.votes) < 10;

  if (isContested) {
    return `
      <span class="contested-badge" title="Highly debated!">
        <svg><!-- Debate icon --></svg>
        Debated
      </span>
    `;
  }
  return '';
}
```

**Badge criteria**:
- `contestedScore > 100,000` (high engagement)
- `|votes| < 10` (close to neutral)

---

## Performance Optimization

### 1. Query Optimization

```javascript
// ✅ GOOD: Use indexed fields
query.orderBy('votes', 'desc').limit(25);

// ❌ BAD: Filter then sort (requires extra index)
query.where('status', '==', 'published').orderBy('votes', 'desc');

// ✅ BETTER: Sort first, filter client-side
const snapshot = await query.orderBy('votes', 'desc').limit(50).get();
const filtered = snapshot.docs.filter(doc => doc.data().status === 'published');
```

### 2. Caching

```javascript
class SortCache {
  constructor(ttl = 60000) { // 1 minute default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.ttl)) {
      return cached.data;
    }
    return null;
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Usage
const cache = new SortCache();
const cacheKey = `${category}_${sortBy}_${mythology}`;

let items = cache.get(cacheKey);
if (!items) {
  items = await loadContent(sortBy);
  cache.set(cacheKey, items);
}
```

### 3. Pagination

```javascript
let lastDoc = null;
const pageSize = 25;

async function loadNextPage(sortBy) {
  let query = db.collection('deities').orderBy('votes', 'desc').limit(pageSize);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();
  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return snapshot.docs;
}
```

### 4. Debouncing

```javascript
let debounceTimer = null;

function handleSortChange(sortBy) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    loadContent(sortBy);
  }, 300); // Wait 300ms after last change
}
```

---

## Analytics

### Track Sort Usage

```javascript
// In SortSelector component
trackAnalytics('sort_changed', {
  sortBy,
  category,
  mythology,
  timestamp: Date.now()
});

// In your analytics service
class AnalyticsManager {
  trackEvent(action, data) {
    if (window.gtag) {
      gtag('event', action, data);
    }

    // Also log to Firestore for internal analytics
    db.collection('analytics').add({
      action,
      ...data,
      userId: auth.currentUser?.uid,
      timestamp: new Date()
    });
  }
}
```

### Useful Metrics

Track these metrics to understand sort usage:
- **Most popular sort method** (votes-desc, contested, etc.)
- **Sort changes per session**
- **Conversion rate** (users who sort → users who engage with content)
- **Contested content views** (how often users explore debated items)

---

## Troubleshooting

### Issue: "Missing Index" Error

**Symptom**: Query fails with "requires an index" error

**Solution**:
1. Check `firestore.indexes.json` includes the required index
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Wait for index creation (check Firebase Console)
4. Retry query

**Common causes**:
- New collection not included in indexes
- Missing combination (e.g., `mythology + contestedScore`)
- Wrong field order in index

### Issue: Contested Score Always 0

**Symptom**: All contested scores are 0

**Solution**:
1. Check items have `upvoteCount` and `downvoteCount` fields
2. Run migration script to update existing items
3. Ensure VoteService is calculating score on every vote

```javascript
// Check if fields exist
const item = await db.collection('assets').doc(itemId).get();
const data = item.data();
console.log('upvoteCount:', data.upvoteCount);
console.log('downvoteCount:', data.downvoteCount);
console.log('contestedScore:', data.contestedScore);
```

### Issue: Sort Preference Not Persisting

**Symptom**: Sort preference resets on page reload

**Solution**:
1. Check localStorage is enabled
2. Verify `preferenceKey` is consistent
3. Check user preferences in Firestore

```javascript
// Debug localStorage
console.log('Stored preference:', localStorage.getItem('content-sort-order'));

// Debug Firestore preferences
const userId = auth.currentUser.uid;
const prefs = await db.collection('user_preferences').doc(userId).get();
console.log('User preferences:', prefs.data());
```

---

## Security Rules

Add these Firestore security rules for voting:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Vote records
    match /votes/{itemType}/{itemId}/{userId} {
      allow read: if true; // Public read
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.data.value in [1, -1];
    }

    // User preferences
    match /user_preferences/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Vote fields on items (updated via VoteService transactions)
    match /{collection}/{itemId} {
      allow read: if true;
      allow update: if request.auth != null
                   && (!request.resource.data.diff(resource.data).affectedKeys()
                       .hasAny(['votes', 'upvoteCount', 'downvoteCount', 'contestedScore', 'totalEngagement'])
                       || request.auth.token.admin == true);
    }
  }
}
```

---

## Testing

### Unit Tests

```javascript
describe('VoteService', () => {
  test('calculates contested score correctly', () => {
    const service = new VoteService(db, auth);

    // Very contested
    expect(service.calculateContestedScore(100, 98)).toBe(197998);

    // Not contested (one-sided)
    expect(service.calculateContestedScore(200, 5)).toBe(204805);

    // Moderate contest
    expect(service.calculateContestedScore(50, 40)).toBe(89990);
  });
});

describe('SortSelector', () => {
  test('saves preference to localStorage', () => {
    const container = document.createElement('div');
    const selector = new SortSelector(container);

    selector.setSort('contested');

    expect(localStorage.getItem('content-sort-order')).toBe('contested');
  });
});
```

### Integration Tests

```javascript
test('sorting updates displayed content', async () => {
  const { getByLabelText, getAllByTestId } = render(<BrowseView />);

  // Select "Most Debated"
  const select = getByLabelText('Sort content by');
  fireEvent.change(select, { target: { value: 'contested' } });

  // Wait for content to update
  await waitFor(() => {
    const items = getAllByTestId('entity-card');
    expect(items.length).toBeGreaterThan(0);
  });

  // Verify first item is contested
  const firstItem = getAllByTestId('entity-card')[0];
  const contestedScore = firstItem.dataset.contestedScore;
  expect(Number(contestedScore)).toBeGreaterThan(100000);
});
```

---

## Best Practices

### 1. Always Use Indexed Queries

```javascript
// ✅ GOOD: Indexed query
db.collection('deities')
  .where('mythology', '==', 'greek')
  .orderBy('votes', 'desc');

// ❌ BAD: Will fail without index
db.collection('deities')
  .where('status', '==', 'published')
  .where('mythology', '==', 'greek')
  .orderBy('votes', 'desc');
```

### 2. Handle Missing Fields Gracefully

```javascript
function getSortValue(entity, sortBy) {
  switch (sortBy) {
    case 'votes-desc':
    case 'votes-asc':
      return entity.votes || 0;
    case 'contested':
      return entity.contestedScore || 0;
    case 'recent':
      return entity.createdAt || new Date(0);
    case 'alphabetical':
      return entity.name || '';
  }
}
```

### 3. Provide User Feedback

```javascript
async function handleSortChange(sortBy) {
  // Show loading state
  showLoadingSpinner();

  try {
    const items = await loadContent(sortBy);
    displayItems(items);

    // Show success message
    showToast(`Sorted by ${getSortLabel(sortBy)}`, 'success');
  } catch (error) {
    // Show error message
    showToast('Failed to sort content. Please try again.', 'error');
    console.error('Sort error:', error);
  } finally {
    hideLoadingSpinner();
  }
}
```

### 4. Combine with Other Filters

```javascript
async function loadContent({ sortBy, mythology, domains }) {
  let query = db.collection('deities');

  // Apply mythology filter
  if (mythology) {
    query = query.where('mythology', '==', mythology);
  }

  // Apply sort
  switch (sortBy) {
    case 'votes-desc':
      query = query.orderBy('votes', 'desc');
      break;
    case 'contested':
      query = query.orderBy('contestedScore', 'desc');
      break;
  }

  // Execute query
  const snapshot = await query.limit(25).get();
  let items = snapshot.docs.map(doc => doc.data());

  // Apply client-side filters (not indexed)
  if (domains && domains.length > 0) {
    items = items.filter(item =>
      item.domains && item.domains.some(d => domains.includes(d))
    );
  }

  return items;
}
```

---

## Roadmap

Future enhancements:

1. **Personalized Sorting**
   - Sort by user's voting history
   - Prioritize content from followed users
   - Hide content user has downvoted

2. **Advanced Metrics**
   - Controversy velocity (rate of vote changes)
   - Time-based contested score (recent votes weighted higher)
   - Domain-specific sorting (e.g., most helpful for "war" deities)

3. **Machine Learning**
   - Predict contested content before votes accumulate
   - Recommend sort method based on user behavior
   - Auto-flag potentially controversial submissions

4. **A/B Testing**
   - Test different contested score formulas
   - Optimize default sort order per category
   - Experiment with badge thresholds

---

## Support

For issues or questions:
- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Documentation**: This file
- **Code Examples**: See `js/components/sort-selector.js`
- **API Reference**: See `js/services/vote-service.js`

---

**Last Updated**: 2025-12-29
**Version**: 1.0.0
**Author**: Agent 10 - Ordering Rules Implementation
