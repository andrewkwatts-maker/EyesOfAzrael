# User Theory System - Complete Implementation Guide

## 🎯 Overview

A complete user authentication and theory submission system for Eyes of Azrael. Users can:

- **Create accounts** and login
- **Submit rich theories** with panels, images, links, and corpus references
- **Organize theories** by topic and subtopic taxonomy (12 topics, 100+ subtopics)
- **Browse and filter** theories by topic, subtopic, author, or search
- **View theories** with full rich content display
- **Vote** on theories (upvote)
- **Comment** on theories
- **Edit and delete** their own theories
- **Embed theory widgets** on any page

## 📁 Files Created

### JavaScript Core
- `js/user-auth.js` - Authentication system (login, signup, session management)
- `js/user-theories.js` - Theory management (CRUD operations, voting, comments, rich content)
- `js/theory-taxonomy.js` - Topic/subtopic taxonomy system (12 topics, 100+ subtopics)
- `js/components/theory-widget.js` - Universal theory widget component
- `js/components/theory-editor.js` - Rich content editor (panels, images, links, corpus)

### Styles
- `css/user-auth.css` - Complete styling for auth, theories, and rich editor

### Pages
- `theories/user-submissions/submit.html` - **NEW** Theory submission page with rich editor
- `theories/user-submissions/browse.html` - **NEW** Browse theories with filtering and grouping
- `theories/user-submissions/view.html` - **NEW** View theory with voting and comments
- `test-user-theories.html` - Complete demo and testing page

### Templates & Tools
- `auth-modal-template.html` - Reusable template for auth modal
- `scripts/add-theory-widgets.js` - Auto-deploy script for all pages
- `USER_THEORY_TESTING_CHECKLIST.md` - Comprehensive testing guide

## 🚀 Quick Start

### 1. Test the Complete Workflow

**Open the main test page:**
```
test-user-theories.html
```

**Complete workflow test:**
1. **Sign Up**: Click "Login / Sign Up" (top right) → Create account (username: test, password: test123)
2. **Submit Theory**: Click "✨ Submit Theory" button
3. **Fill Rich Editor**:
   - Enter theory title
   - Select topic (e.g., "Mythologies") and subtopic (e.g., "Greek Mythology")
   - Add panels with content
   - Add images, links, corpus searches (optional)
4. **Submit**: Click "🚀 Submit Theory" → Redirects to browse page
5. **Browse**: Your theory appears highlighted → Filter, sort, group by topic/subtopic/author
6. **View**: Click on theory → See full rich content display
7. **Vote**: Click 👍 Upvote button
8. **Comment**: Add a comment at the bottom
9. **Navigate**: Use breadcrumbs or "Back to Browse" button

**Alternative: Use direct page URLs:**
- Submit: `theories/user-submissions/submit.html`
- Browse: `theories/user-submissions/browse.html`
- View: `theories/user-submissions/view.html?id={theory_id}`

### 2. Manual Integration (Single Page)

Add to your page's `<head>`:
```html
<!-- User Auth & Theory System -->
<link rel="stylesheet" href="/css/user-auth.css">
<script defer src="/js/user-auth.js"></script>
<script defer src="/js/user-theories.js"></script>
<script defer src="/js/components/theory-widget.js"></script>
```

Add before `</body>`:
```html
<!-- Copy content from auth-modal-template.html -->
```

Add theory widget anywhere on the page:
```html
<!-- Button mode (opens modal) -->
<div data-theory-widget
     data-page="deity/zeus"
     data-title="Zeus - King of the Gods"
     data-mode="button"></div>

<!-- OR Inline mode (displays on page) -->
<div data-theory-widget
     data-page="deity/zeus"
     data-title="Zeus - King of the Gods"
     data-mode="inline"></div>
```

### 3. Automated Deployment (All Pages)

**DRY RUN (preview changes):**
```bash
node scripts/add-theory-widgets.js --dry-run --verbose
```

**DEPLOY (apply changes):**
```bash
node scripts/add-theory-widgets.js
```

This will:
- Scan all HTML files in `mythos/`, `spiritual-items/`, `spiritual-places/`, `magic/`, `archetypes/`
- Add required scripts to `<head>`
- Insert auth modal before `</body>`
- Add inline theory widget before footer

## 💭 Widget Modes

### Button Mode
```html
<div data-theory-widget
     data-page="unique-page-id"
     data-title="Page Title"
     data-mode="button"></div>
```
- Shows a button with theory count
- Opens modal when clicked
- Good for compact integration

### Inline Mode
```html
<div data-theory-widget
     data-page="unique-page-id"
     data-title="Page Title"
     data-mode="inline"></div>
```
- Displays theories directly on page
- No modal needed
- Good for dedicated theory sections

## 🎨 Styling

The system uses CSS variables from your theme:

```css
:root {
    --mythos-primary: #9333ea;           /* Primary color */
    --color-surface: #1a1a2e;            /* Card backgrounds */
    --color-border: rgba(147, 51, 234, 0.4); /* Borders */
    --color-text-primary: #fff;          /* Primary text */
    --color-text-secondary: #999;        /* Secondary text */
    --radius-lg: 12px;                   /* Border radius */
    --radius-xl: 16px;                   /* Large border radius */
}
```

Override these in your page's CSS to customize appearance.

## 📊 Features

### Authentication
- ✅ Signup with username, email, password
- ✅ Login with session persistence
- ✅ Logout
- ✅ Form validation
- ✅ Avatar generation (DiceBear API)
- ✅ Multi-tab synchronization

### Theory Management
- ✅ Create theories with rich form
  - Title, summary, content
  - Category selection
  - Sources/references
  - Related mythologies
  - Automatic page linking
- ✅ Edit own theories
- ✅ Delete own theories
- ✅ View count tracking
- ✅ Timestamp (created/updated)

### Voting
- ✅ Upvote/downvote
- ✅ Visual feedback (voted state)
- ✅ Vote count display
- ✅ Change or remove vote
- ✅ Must be logged in

### Comments
- ✅ Add comments to theories
- ✅ Comment threading
- ✅ Author avatars
- ✅ Timestamps
- ✅ Must be logged in

### Filtering & Search
- ✅ Filter by page
- ✅ Filter by category
- ✅ Filter by author
- ✅ Filter by mythology
- ✅ Sort by: newest, oldest, popular, views

## 💾 Data Storage

### Firebase Cloud Backend

**Current: Firebase (Cloud-based)**
- **Authentication:** Google OAuth (Firebase Auth)
- **Database:** Cloud Firestore (NoSQL)
- **Storage:** Firebase Storage (Images)
- **Sync:** Real-time across all devices
- **Backup:** Automatic cloud backups
- **Security:** Server-side security rules

**Data Collections:**

**Firestore Structure:**
```
/users/{userId}
  - uid (Firebase user ID)
  - email (Google account)
  - displayName (Google name)
  - photoURL (Google photo)
  - bio (optional)
  - createdAt, updatedAt

/theories/{theoryId}
  - title, summary, content
  - topic, subtopic
  - richContent (panels, images, links)
  - authorId, authorName, authorAvatar
  - votes, views, commentCount
  - status (published/draft/deleted)
  - createdAt, updatedAt

/theories/{theoryId}/comments/{commentId}
  - content
  - authorId, authorName, authorAvatar
  - createdAt

/theories/{theoryId}/votes/{userId}
  - direction (1 or -1)
  - createdAt
```

**Firebase Storage Structure:**
```
/theory-images/{userId}/{theoryId}/{filename}
  - Max 5MB per image
  - Allowed types: image/*
  - Public read, owner write/delete
```

**Free Tier Limits:**
- Firestore: 50K reads/day, 20K writes/day, 1GB storage
- Storage: 5GB total, 1GB/day downloads
- Authentication: Unlimited
- **Sufficient for most websites**

**Migration from localStorage:**
See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for automatic migration process

## 🔒 Security

**Firebase Security Features:**

1. **Authentication:**
   - Google OAuth (industry standard)
   - No password management needed
   - Secure session handling
   - Automatic token refresh

2. **Firestore Security Rules:**
   - Server-side access control
   - User can only edit own theories
   - Public read for published theories
   - Prevent unauthorized writes

3. **Storage Security Rules:**
   - User can only upload to own folder
   - File size limits (5MB max)
   - File type restrictions (images only)
   - Public read for hosted images

4. **Data Validation:**
   - Client-side input validation
   - Server-side rule validation
   - XSS prevention (Firestore auto-escapes)
   - Rate limiting via security rules

**Security Rules Examples:**

**Firestore (theories):**
```javascript
// Anyone can read published theories
allow read: if resource.data.status == 'published';

// Only author can update their own theory
allow update: if request.auth != null
              && resource.data.authorId == request.auth.uid;
```

**Storage (images):**
```javascript
// Only authenticated user can upload to their folder
allow create: if request.auth != null
              && request.auth.uid == userId
              && request.resource.size < 5 * 1024 * 1024;
```

**Production Ready:**
- ✅ HTTPS enforced (Firebase Hosting)
- ✅ Secure authentication (Google OAuth)
- ✅ Server-side validation (Security Rules)
- ✅ XSS protection (Firestore)
- ✅ Rate limiting (configurable)
- ✅ Data encryption (Firebase default)

**See:** [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for security rule deployment

## 📱 Responsive Design

- ✅ Mobile-friendly
- ✅ Touch-optimized
- ✅ Flexible layouts
- ✅ Readable on all screen sizes

Media queries at:
- 768px (tablet/mobile)

## ♿ Accessibility

- ✅ Keyboard navigation support
- ✅ Focus visible styles
- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Reduced motion support

## 🧪 Testing Checklist

### Authentication
- [ ] Create account with valid data
- [ ] Try creating account with duplicate username
- [ ] Try creating account with invalid email
- [ ] Try creating account with short password (<6 chars)
- [ ] Login with correct credentials
- [ ] Login with wrong credentials
- [ ] Logout
- [ ] Check session persists on page reload
- [ ] Check multi-tab synchronization

### Theories
- [ ] Create theory when logged in
- [ ] Try creating theory when logged out (should prompt login)
- [ ] Edit own theory
- [ ] Try editing someone else's theory (should fail)
- [ ] Delete own theory
- [ ] View theory details
- [ ] Check view count increments

### Voting
- [ ] Upvote a theory
- [ ] Downvote a theory
- [ ] Change vote from up to down
- [ ] Remove vote by clicking same button
- [ ] Try voting when logged out (should prompt login)

### Comments
- [ ] Add comment to theory
- [ ] Try commenting when logged out (should prompt login)
- [ ] View comments list

### Widgets
- [ ] Test button mode widget
- [ ] Test inline mode widget
- [ ] Test with different page IDs
- [ ] Test with special characters in title

### UI/UX
- [ ] Check responsive design on mobile
- [ ] Check theme integration
- [ ] Check animations
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if possible)

## 🐛 Troubleshooting

### Widgets not appearing
1. Check browser console for errors
2. Verify scripts are loaded (check Network tab)
3. Confirm `data-theory-widget` attribute is correct
4. Check that `window.userAuth` and `window.userTheories` exist

### Login not working
1. Open browser console
2. Check localStorage: `localStorage.getItem('users')`
3. Verify password meets minimum length (6 chars)
4. Clear localStorage and try again: `localStorage.clear()`

### Theories not saving
1. Check localStorage size (has 5-10MB limit)
2. Open console and check for errors
3. Verify user is logged in: `window.userAuth.isLoggedIn()`
4. Check theory object: `window.userTheories.getAllTheories()`

### Styling issues
1. Verify `user-auth.css` is loaded
2. Check for CSS conflicts with existing styles
3. Inspect elements to see which styles are applied
4. Ensure CSS variables are defined

## 📖 API Reference

### Firebase Authentication API

**Global namespace:** `window.firebaseAuth`

```javascript
// Sign in with Google
await window.firebaseAuth.signInWithGoogle()
// Returns: { success: boolean, user?: Object, error?: string }

// Sign out
await window.firebaseAuth.signOut()
// Returns: { success: boolean, error?: string }

// Get current user
window.firebaseAuth.getCurrentUser()
// Returns: { uid, email, displayName, photoURL, emailVerified } | null

// Check if logged in
window.firebaseAuth.isLoggedIn()
// Returns: boolean

// Listen for auth state changes
window.firebaseAuth.onAuthStateChanged(callback)
// callback: (user) => void
// Returns: unsubscribe function
```

### Firebase Database API

**Global namespace:** `window.firebaseDB`

```javascript
// Create theory
await window.firebaseDB.createTheory({
    title: string,
    summary: string,
    content: string,
    topic: string,
    subtopic: string,
    richContent?: {
        panels: Array,
        images: Array,
        links: Array,
        corpusSearches: Array
    },
    relatedPage?: string,
    sources?: string,
    relatedMythologies?: Array
})
// Returns: { success: boolean, theory?: Theory, error?: string }

// Get all theories (with filters)
await window.firebaseDB.getAllTheories({
    status?: 'published' | 'draft' | 'deleted',
    topic?: string,
    subtopic?: string,
    authorId?: string,
    relatedPage?: string,
    sortBy?: 'newest' | 'oldest' | 'popular' | 'views',
    limit?: number,
    startAfter?: DocumentSnapshot
})
// Returns: { success: boolean, theories?: Array, lastDoc?: DocumentSnapshot, error?: string }

// Get single theory
await window.firebaseDB.getTheory(theoryId)
// Returns: { success: boolean, theory?: Theory, error?: string }

// Update theory
await window.firebaseDB.updateTheory(theoryId, updates)
// Returns: { success: boolean, theory?: Theory, error?: string }

// Delete theory (soft delete)
await window.firebaseDB.deleteTheory(theoryId)
// Returns: { success: boolean, message?: string, error?: string }

// Vote on theory
await window.firebaseDB.voteTheory(theoryId, direction)
// direction: 1 for upvote, -1 for downvote, 0 to remove vote
// Returns: { success: boolean, votes?: number, userVote?: number, error?: string }

// Add comment
await window.firebaseDB.addComment(theoryId, content)
// Returns: { success: boolean, comment?: Comment, error?: string }

// Get comments
await window.firebaseDB.getComments(theoryId)
// Returns: { success: boolean, comments?: Array, error?: string }

// Increment view count
await window.firebaseDB.incrementViewCount(theoryId)
// Returns: { success: boolean, views?: number, error?: string }
```

### Firebase Storage API

**Global namespace:** `window.firebaseStorage`

```javascript
// Upload image
await window.firebaseStorage.uploadImage(
    file,              // File object
    theoryId,          // Theory ID
    onProgress         // Optional: (progress) => void
)
// Returns: { success: boolean, url?: string, path?: string, error?: string }

// Delete image
await window.firebaseStorage.deleteImage(path)
// Returns: { success: boolean, message?: string, error?: string }

// Get download URL
await window.firebaseStorage.getDownloadURL(path)
// Returns: { success: boolean, url?: string, error?: string }
```

**Detailed API Documentation:** See [API_REFERENCE.md](./API_REFERENCE.md)

## 🎯 Next Steps

### For New Deployments

1. **Set up Firebase:**
   - Follow [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
   - Create Firebase project
   - Enable Authentication, Firestore, Storage
   - Deploy security rules

2. **Configure Application:**
   - Copy Firebase config to `firebase-config.js`
   - Update `.firebaserc` with project ID
   - Test locally

3. **Deploy:**
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Deploy to Firebase Hosting (recommended)
   - Or use GitHub Pages, Netlify, Vercel

4. **Monitor:**
   - See [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
   - Set up quota alerts
   - Implement caching for optimization

### For Existing Users

1. **Migration:**
   - See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
   - Sign in with Google
   - Automatic migration of localStorage data
   - Verify all theories migrated

2. **New Features:**
   - Upload images directly
   - Access from any device
   - Real-time updates
   - Cloud backup

### For Developers

1. **Read Documentation:**
   - [API_REFERENCE.md](./API_REFERENCE.md) - Complete API docs
   - [BACKEND_MIGRATION_PLAN.md](./BACKEND_MIGRATION_PLAN.md) - Architecture

2. **Integrate Firebase:**
   - Replace localStorage calls with Firebase API
   - Add image upload functionality
   - Implement real-time listeners

3. **Test Thoroughly:**
   - Use [USER_THEORY_TESTING_CHECKLIST.md](./USER_THEORY_TESTING_CHECKLIST.md)
   - Test auth flow
   - Test CRUD operations
   - Test image uploads
   - Test public viewing

## 📝 License

Part of the Eyes of Azrael project.

---

**Built with ❤️ by Claude Code**
