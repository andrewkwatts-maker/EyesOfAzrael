# Eyes of Azrael - Comprehensive Reddit-Style Platform Plan

## Vision
Transform Eyes of Azrael into a community-driven mythology encyclopedia where users can submit, discuss, and curate content - similar to Reddit but focused on mythological knowledge.

---

## Phase 1: Core Asset Submission System (SOLID Principles)

### 1.1 Universal Asset Submission Service
**Single Responsibility**: Each service handles one asset type
**Open/Closed**: Extendable for new asset types without modifying existing code

```
js/services/
├── asset-submission-base.js      # Abstract base class (Interface Segregation)
├── deity-submission.js           # Deity-specific submission
├── creature-submission.js        # Creature-specific submission
├── hero-submission.js            # Hero-specific submission
├── item-submission.js            # Item-specific submission
├── place-submission.js           # Place-specific submission
├── text-submission.js            # Text-specific submission
├── ritual-submission.js          # Ritual-specific submission
├── herb-submission.js            # Herb-specific submission
├── symbol-submission.js          # Symbol-specific submission
├── archetype-submission.js       # Archetype-specific submission
├── mythology-submission.js       # Mythology-specific submission
└── cosmology-submission.js       # Cosmology-specific submission
```

### 1.2 Submission Workflow
1. User initiates submission
2. Multi-step wizard collects data
3. AI validates content quality
4. Corpus search validates claims
5. Submission enters moderation queue
6. Community can vote/comment during review
7. Moderators approve/reject with feedback

---

## Phase 2: Asset Deletion & Recovery System

### 2.1 Soft Delete with AI Auto-Population
When an asset is deleted:
1. Mark as `deleted: true, deletedAt: timestamp, deletedBy: userId`
2. Trigger AI auto-population:
   - Keep: `id`, `name`, `title`, `type`, `mythology`
   - Clear: User-generated content
   - Add banner: "This content was deleted and auto-populated. Claim ownership to update."
3. AI generates:
   - Basic description from name/type
   - Related entities based on mythology
   - Placeholder sections
   - Corpus search queries for context

### 2.2 Ownership Claim System
```javascript
// Firestore structure
assetOwnership: {
  assetId: string,
  currentOwner: userId | null,
  ownershipStatus: 'owned' | 'unclaimed' | 'pending_transfer',
  claimRequests: [{
    userId: string,
    requestedAt: timestamp,
    contributionScore: number,
    reason: string
  }],
  transferDeadline: timestamp | null,  // 7 days after deletion
  contributionHistory: [{
    userId: string,
    contributionType: string,
    contributionDate: timestamp,
    weight: number
  }]
}
```

### 2.3 Ownership Transfer Rules
1. **Auto-assign on Delete**: If most active contributor requests within 7 days
2. **Highest Score Wins**: After 7 days, highest contribution score gets ownership
3. **Contribution Weights**:
   - Major edit: 10 points
   - Minor edit: 3 points
   - Discussion comment: 1 point
   - Verified corpus citation: 5 points
   - Approved suggestion: 7 points

---

## Phase 3: Content Filtering & Ordering System

### 3.1 Filter/Sort Options
```javascript
const SORT_OPTIONS = {
  MOST_POPULAR: { field: 'upvotes', direction: 'desc' },
  LEAST_POPULAR: { field: 'upvotes', direction: 'asc' },
  MOST_CONTROVERSIAL: { field: 'controversyScore', direction: 'desc' }, // upvotes close to downvotes
  LEAST_CONTROVERSIAL: { field: 'controversyScore', direction: 'asc' },
  NEWEST: { field: 'createdAt', direction: 'desc' },
  OLDEST: { field: 'createdAt', direction: 'asc' },
  BIGGEST_CONTRIBUTION: { field: 'contentSize', direction: 'desc' },
  SMALLEST_CONTRIBUTION: { field: 'contentSize', direction: 'asc' }
};
```

### 3.2 Controversy Score Calculation
```javascript
function calculateControversyScore(upvotes, downvotes) {
  const total = upvotes + downvotes;
  if (total === 0) return 0;
  const ratio = Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes);
  return ratio * Math.log(total + 1); // Higher when votes are balanced AND numerous
}
```

### 3.3 Contribution Size Metrics
```javascript
function calculateContributionSize(asset) {
  return {
    textLength: asset.description?.length || 0,
    sectionCount: asset.sections?.length || 0,
    relationshipCount: Object.values(asset.relationships || {}).flat().length,
    sourceCount: asset.sources?.length || 0,
    imageCount: asset.images?.length || 0,
    totalScore: // weighted sum
  };
}
```

---

## Phase 4: Reddit-Style Interaction Features

### 4.1 Comment Threading
- Nested replies (max 10 levels)
- Collapse/expand threads
- "Load more replies" pagination
- Best/New/Controversial sorting per thread

### 4.2 User Perspectives (like Reddit posts)
- Users can add "perspectives" on assets
- Each perspective has its own comment thread
- Perspectives require corpus citations
- Community votes on perspectives

### 4.3 Suggested Edits
- Users propose changes to asset content
- Changes shown as diff view
- Community votes on suggestions
- High-voted suggestions auto-approved

### 4.4 Relationship Suggestions
- Users can suggest new entity relationships
- Must cite corpus evidence
- Visual relationship builder
- Community validation

---

## Phase 5: Gamification & Reputation

### 5.1 Contribution Points
| Action | Points |
|--------|--------|
| Submit approved asset | +50 |
| Submit approved edit | +10 |
| Verified corpus citation | +5 |
| Comment | +1 |
| Upvoted comment | +2 |
| Downvoted comment | -1 |

### 5.2 Badges
- **Scholar**: 100 corpus citations
- **Mythologist**: 50 approved edits
- **Curator**: Owns 10+ assets
- **Controversial**: 10 controversial posts
- **Pioneer**: First to document an entity

### 5.3 Leaderboards
- Top contributors by mythology
- Top contributors by asset type
- Weekly/Monthly/All-time views

---

## Implementation Order (Parallel Agents)

### Batch 1: Core Services (8 agents)
1. Asset Submission Base Service
2. Ownership Transfer Service
3. Deletion Recovery Service
4. Content Filtering Service
5. Voting & Controversy Service
6. Contribution Tracking Service
7. AI Auto-Population Service
8. Firestore Rules Update

### Batch 2: UI Components (8 agents)
1. Universal Submission Wizard (all types)
2. Ownership Claim UI
3. Deletion Warning Modal
4. Sort/Filter Controls
5. Controversy Badge Display
6. Contribution Size Indicator
7. Ownership Status Banner
8. Claim Countdown Timer

### Batch 3: Reddit Features (8 agents)
1. Enhanced Comment Threading
2. Perspectives System
3. Suggested Edits System
4. Relationship Suggestions
5. Contribution Leaderboard
6. Activity Feed
7. Notification System
8. User Contribution History

### Batch 4: Asset Enrichment (24 agents)
- Each agent enriches ~20 smallest assets
- Add sections, subsections, diagrams
- Create corpus queries
- Link related assets
- Add metadata (geo, chrono, relationships)

---

## Files to Create/Modify

### New Services
- `js/services/asset-submission-base.js`
- `js/services/ownership-service.js`
- `js/services/deletion-recovery-service.js`
- `js/services/content-filter-service.js`
- `js/services/controversy-service.js`
- `js/services/ai-population-service.js`

### New Components
- `js/components/universal-submission-wizard.js`
- `js/components/ownership-claim-modal.js`
- `js/components/sort-filter-controls.js`
- `js/components/contribution-indicator.js`
- `js/components/suggested-edit-diff.js`
- `js/components/claim-countdown.js`

### New CSS
- `css/submission-wizard.css`
- `css/ownership-system.css`
- `css/sort-filter.css`
- `css/contribution-badges.css`

### Firestore Collections
- `assetOwnership` - Ownership tracking
- `ownershipClaims` - Pending claims
- `deletedAssets` - Soft-deleted assets
- `suggestedEdits` - Edit proposals
- `contributionScores` - User scores per asset

---

## Success Metrics
- User submissions per week
- Average time to claim ownership
- Community vote participation rate
- Corpus citation quality score
- Asset completeness improvement
