# Firestore Database - Quick Reference Guide

## 🚀 Quick Start

### Include Required Scripts
```html
<!-- Firebase SDK (from Agent 1) -->
<script src="js/firebase-init.js"></script>

<!-- Firestore Integration -->
<script src="js/firebase-db.js"></script>
<script src="js/firestore-queries.js"></script>

<!-- User Theories (updated) -->
<script src="js/user-theories.js"></script>
```

---

## 📝 Common Operations

### Create a Theory
```javascript
const result = await window.userTheories.submitTheory({
    title: "Theory Title",
    summary: "Brief summary",
    content: "Theory content...",
    topic: "mythology",
    topicName: "Mythology",
    subtopic: "comparative",
    subtopicName: "Comparative Studies",
    sources: "Source references...",
    tags: ["tag1", "tag2"]
});

if (result.success) {
    console.log("Theory created:", result.theoryId);
}
```

### Get All Theories
```javascript
// Simple - get all published theories
const theories = await window.userTheories.getAllTheories();

// With filters
const theories = await window.userTheories.getAllTheories({
    topic: 'mythology',
    sortBy: 'popular',
    limit: 20
});

// With pagination (Firestore mode)
const result = await window.firebaseDB.getTheories({
    status: 'published',
    limit: 20,
    startAfter: lastDocumentSnapshot
});

console.log(result.theories);      // Array of theories
console.log(result.hasMore);       // More results available?
console.log(result.lastDoc);       // Use for next page
```

### Get Single Theory
```javascript
const theory = await window.userTheories.getTheory(theoryId);

if (theory) {
    console.log(theory.title);
    console.log(theory.votes);
    console.log(theory.comments);
}
```

### Update Theory
```javascript
const result = await window.userTheories.updateTheory(theoryId, {
    title: "Updated Title",
    summary: "Updated summary",
    status: 'published'
});

if (result.success) {
    console.log("Theory updated!");
}
```

### Delete Theory
```javascript
// Soft delete (sets status = 'deleted')
const result = await window.userTheories.deleteTheory(theoryId);

if (result.success) {
    console.log("Theory deleted!");
}
```

### Vote on Theory
```javascript
// Upvote
const result = await window.userTheories.voteTheory(theoryId, 1);

// Vote again to remove vote (toggle)
const result = await window.userTheories.voteTheory(theoryId, 1);
```

### Add Comment
```javascript
const result = await window.userTheories.addComment(
    theoryId,
    "This is my comment!"
);

if (result.success) {
    console.log("Comment added:", result.comment);
}
```

### Get Comments
```javascript
const comments = await window.userTheories.getComments(theoryId);

comments.forEach(comment => {
    console.log(comment.author);
    console.log(comment.content);
    console.log(comment.createdAt);
});
```

---

## 🔴 Real-time Updates

### Listen to Theory Changes
```javascript
const unsubscribe = window.userTheories.listenToTheory(
    theoryId,
    (updatedTheory) => {
        console.log("Theory updated:", updatedTheory.votes);
        // Update UI here
    }
);

// Stop listening when done
unsubscribe();
```

### Listen to Comments
```javascript
const unsubscribe = window.userTheories.listenToComments(
    theoryId,
    (comments) => {
        console.log("Comments updated:", comments.length);
        // Update UI here
    }
);

// Stop listening
unsubscribe();
```

### Clean Up All Listeners
```javascript
// When leaving page
window.userTheories.stopListening(theoryId);

// Or cleanup manually
window.addEventListener('beforeunload', () => {
    window.userTheories.stopListening(theoryId);
});
```

---

## 🔍 Advanced Queries

### Filter by Topic
```javascript
const theories = await window.firestoreQueries.filterByTopic('mythology', {
    sort: 'newest',
    limit: 20
});
```

### Filter by Author
```javascript
const theories = await window.firestoreQueries.filterByAuthor('username', {
    sort: 'popular'
});
```

### Search Theories
```javascript
const result = await window.firestoreQueries.search('ancient gods', {
    topic: 'mythology'
}, {
    limit: 50
});
```

### Get Trending Theories
```javascript
// Theories from last 7 days, sorted by votes
const result = await window.firestoreQueries.getTrendingTheories(7, 10);
```

### Get Related Theories
```javascript
const result = await window.firestoreQueries.getRelatedTheories(currentTheory, 5);
```

### Group Theories
```javascript
const groups = await window.firestoreQueries.groupByTopic(theories);

// Result structure:
// {
//   'mythology': { topicName: 'Mythology', theories: [...] },
//   'physics': { topicName: 'Physics', theories: [...] }
// }
```

### Get Statistics
```javascript
const stats = await window.firestoreQueries.getStatistics();

console.log(stats.totalTheories);
console.log(stats.totalVotes);
console.log(stats.authors);
console.log(stats.mostPopular);
```

---

## 🎨 UI Integration Examples

### Browse Page with Pagination
```javascript
class TheoryBrowser {
    constructor() {
        this.pagination = {
            lastDoc: null,
            hasMore: false,
            loadedTheories: []
        };
    }

    async loadTheories(loadMore = false) {
        const result = await window.userTheories.getAllTheories({
            status: 'published',
            limit: 20,
            startAfter: loadMore ? this.pagination.lastDoc : null
        });

        if (loadMore) {
            this.pagination.loadedTheories.push(...result.theories);
        } else {
            this.pagination.loadedTheories = result.theories;
        }

        this.pagination.hasMore = result.hasMore;
        this.pagination.lastDoc = result.lastDoc;

        this.renderTheories();
    }

    renderTheories() {
        const html = this.pagination.loadedTheories
            .map(t => `<div>${t.title}</div>`)
            .join('');

        document.getElementById('theories').innerHTML = html;

        if (this.pagination.hasMore) {
            document.getElementById('load-more').style.display = 'block';
        }
    }

    async loadMore() {
        await this.loadTheories(true);
    }
}
```

### View Page with Real-time Updates
```javascript
let unsubscribeTheory = null;
let unsubscribeComments = null;

async function loadTheory(theoryId) {
    // Initial load
    const theory = await window.userTheories.getTheory(theoryId);
    renderTheory(theory);

    // Set up real-time listeners
    unsubscribeTheory = window.userTheories.listenToTheory(
        theoryId,
        (updatedTheory) => {
            updateVoteCount(updatedTheory.votes);
        }
    );

    unsubscribeComments = window.userTheories.listenToComments(
        theoryId,
        (comments) => {
            renderComments(comments);
        }
    );
}

function updateVoteCount(votes) {
    document.querySelector('.vote-count').textContent = votes;
}

function renderComments(comments) {
    const html = comments
        .map(c => `<div class="comment">${c.content}</div>`)
        .join('');
    document.querySelector('.comments').innerHTML = html;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribeTheory) unsubscribeTheory();
    if (unsubscribeComments) unsubscribeComments();
});
```

---

## ⚡ Performance Tips

### 1. Use Pagination
```javascript
// BAD - Loads all theories
const theories = await window.userTheories.getAllTheories();

// GOOD - Loads 20 at a time
const result = await window.userTheories.getAllTheories({ limit: 20 });
```

### 2. Cache Results
```javascript
// FirebaseDB has built-in caching
const theory = await window.firebaseDB.getTheory(theoryId, true); // Use cache
```

### 3. Batch Reads
```javascript
// BAD - Multiple reads
for (const id of theoryIds) {
    const theory = await window.firebaseDB.getTheory(id);
}

// GOOD - Single query with filter
const theories = await window.firebaseDB.getTheories({
    // Use appropriate filter
});
```

### 4. Clean Up Listeners
```javascript
// Always unsubscribe when done
const unsubscribe = window.userTheories.listenToTheory(id, callback);

// Later...
unsubscribe();
```

---

## 🐛 Error Handling

### Try-Catch Pattern
```javascript
try {
    const result = await window.userTheories.submitTheory(data);
    if (result.success) {
        // Success
    } else {
        // Handle error
        console.error(result.error);
    }
} catch (error) {
    // Network or Firebase error
    console.error('Failed:', error);
}
```

### Check Firestore Availability
```javascript
if (window.userTheories.useFirestore) {
    // Firestore is available
    // Real-time features work
} else {
    // Using localStorage fallback
    // No real-time updates
}
```

---

## 📊 Data Structure Reference

### Theory Object
```javascript
{
    id: "theory_123456",
    title: "Theory Title",
    summary: "Brief summary",
    content: "Full content...",
    richContent: {
        panels: [...],
        images: [...],
        links: [...],
        corpusSearches: [...]
    },
    topic: "mythology",
    topicName: "Mythology",
    topicIcon: "🏛️",
    subtopic: "comparative",
    subtopicName: "Comparative Studies",
    category: "pattern", // Legacy
    sources: "References...",
    relatedMythologies: ["greek", "norse"],
    relatedPage: "/mythologies/greek.html",
    tags: ["pattern", "connection"],
    authorId: "user_123",
    authorName: "Username",
    authorAvatar: "https://...",
    votes: 42,
    views: 150,
    status: "published", // or "deleted"
    createdAt: Date,
    updatedAt: Date
}
```

### Comment Object
```javascript
{
    id: "comment_123456",
    content: "Comment text",
    authorId: "user_123",
    authorName: "Username",
    authorAvatar: "https://...",
    createdAt: Date
}
```

### Vote Object (Firestore subcollection)
```javascript
{
    direction: 1,
    userId: "user_123",
    createdAt: Date
}
```

---

## 🔐 Security Notes

### Authentication Required
```javascript
// These operations require login:
- submitTheory()
- updateTheory()
- deleteTheory()
- voteTheory()
- addComment()

// These are public:
- getTheory()
- getAllTheories()
- getComments()
```

### Ownership Checks
```javascript
// Firestore automatically enforces:
- Only author can update their theory
- Only author can delete their theory
- Anyone can read published theories
```

---

## 🆚 localStorage vs Firestore

### Feature Comparison
| Feature | localStorage | Firestore |
|---------|-------------|-----------|
| Real-time updates | ❌ | ✅ |
| Multi-user | ❌ | ✅ |
| Pagination | ❌ | ✅ |
| Offline access | ✅ | ✅ |
| Transaction safety | ❌ | ✅ |
| Storage limit | ~5-10MB | 1GB+ |
| Requires internet | ❌ | ✅ (with offline cache) |

### Automatic Fallback
The system automatically uses localStorage if:
- Firebase is not initialized
- User is offline (after cache expires)
- Firestore operations fail

---

## 📚 Additional Resources

- **Full documentation:** `FIRESTORE_DATABASE_INTEGRATION.md`
- **Migration plan:** `BACKEND_MIGRATION_PLAN.md`
- **Security rules:** See `firestore.rules` (from Agent 1)
- **API reference:** See individual file JSDoc comments

---

## 🆘 Common Issues

### Issue: "Firebase not initialized"
```javascript
// Solution: Ensure firebase-init.js loads first
<script src="js/firebase-init.js"></script>
<script src="js/firebase-db.js"></script>
<script src="js/user-theories.js"></script>
```

### Issue: "Index required" error
```javascript
// Solution: Click the error link in console
// Firebase will auto-create the required index
// Wait 1-2 minutes for index to build
```

### Issue: Real-time updates not working
```javascript
// Check if Firestore is being used
if (window.userTheories.useFirestore) {
    // Set up listeners
} else {
    // localStorage mode - no real-time
}
```

### Issue: Pagination not working
```javascript
// Ensure you're using the paginated response
const result = await window.userTheories.getAllTheories({ limit: 20 });

// Check if it's a paginated response
if (result.theories) {
    // Firestore mode with pagination
    const theories = result.theories;
    const hasMore = result.hasMore;
} else {
    // localStorage mode - array directly
    const theories = result;
}
```

---

**Last Updated:** 2025-12-06
**Agent:** Agent 4 - Firestore Database Integration
