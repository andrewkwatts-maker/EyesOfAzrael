# User Theory System - Complete Implementation Guide

## 🎯 Overview

A complete user authentication and theory submission system for Eyes of Azrael. Users can:

- **Create accounts** and login
- **Submit theories** about mythology, deities, places, and concepts
- **Vote** on theories (upvote/downvote)
- **Comment** on theories
- **Edit and delete** their own theories
- **Browse** theories by page, category, or author

## 📁 Files Created

### JavaScript Core
- `js/user-auth.js` - Authentication system (login, signup, session management)
- `js/user-theories.js` - Theory management (CRUD operations, voting, comments)
- `js/components/theory-widget.js` - Universal theory widget component

### Styles
- `css/user-auth.css` - Complete styling for auth and theory system

### Templates & Tools
- `auth-modal-template.html` - Reusable template for auth modal
- `test-user-theories.html` - **TEST THIS PAGE FIRST** - Complete demo
- `scripts/add-theory-widgets.js` - Auto-deploy script for all pages

## 🚀 Quick Start

### 1. Test the System

**Open this file in your browser:**
```
test-user-theories.html
```

**Then:**
1. Click "Sign Up" (top right)
2. Create an account (username: test, password: test123)
3. Click "Add Theory" button
4. Fill out the form and submit
5. Vote on your theory
6. View the full theory
7. Add a comment

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

**Current: localStorage (Client-side)**
- Stored in browser only
- Survives page reloads
- Not synced across devices
- Data persists until browser cache cleared

**Collections:**
- `users` - User accounts
- `userTheories` - All theories
- `currentUser` - Active session

**Future: Backend Database**
The system is designed to be easily upgraded to use a backend API:
- Replace localStorage calls with fetch() API calls
- Add proper password hashing (bcrypt)
- Enable cross-device sync
- Add moderation tools
- Implement search indexing

## 🔒 Security Notes

**Current Implementation:**
- Password "hashing" is simple (demonstration only)
- All data stored client-side
- No server-side validation

**⚠️ NOT PRODUCTION READY for sensitive data**

**For Production:**
- Implement proper server-side authentication
- Use bcrypt or argon2 for password hashing
- Add HTTPS
- Implement rate limiting
- Add email verification
- Add password reset
- Add CSRF protection
- Add XSS sanitization

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

### window.userAuth

```javascript
// Signup
window.userAuth.signup(username, email, password)
// Returns: { success: boolean, message/error: string }

// Login
window.userAuth.login(username, password)
// Returns: { success: boolean, message/error: string }

// Logout
window.userAuth.logout()

// Check if logged in
window.userAuth.isLoggedIn()
// Returns: boolean

// Get current user
window.userAuth.getCurrentUser()
// Returns: { username, email, avatar, bio, createdAt } | null

// Show modals
window.userAuth.showLoginModal()
window.userAuth.showSignupModal()
window.userAuth.hideAuthModal()
```

### window.userTheories

```javascript
// Submit theory
window.userTheories.submitTheory({
    title: string,
    summary: string,
    content: string,
    category: string,
    sources: string,
    relatedMythologies: string[],
    relatedPage: string
})
// Returns: { success: boolean, theory/error: object/string }

// Get all theories
window.userTheories.getAllTheories({
    status: 'published' | 'draft',
    category: string,
    author: string,
    mythology: string,
    relatedPage: string,
    sortBy: 'newest' | 'oldest' | 'popular' | 'views'
})
// Returns: Theory[]

// Get single theory
window.userTheories.getTheory(theoryId)
// Returns: Theory | undefined

// Update theory
window.userTheories.updateTheory(theoryId, updates)
// Returns: { success: boolean, theory/error: object/string }

// Delete theory
window.userTheories.deleteTheory(theoryId)
// Returns: { success: boolean, message/error: string }

// Vote
window.userTheories.voteTheory(theoryId, direction)
// direction: 1 for upvote, -1 for downvote
// Returns: { success: boolean, votes/error: number/string }

// Add comment
window.userTheories.addComment(theoryId, content)
// Returns: { success: boolean, comment/error: object/string }
```

## 🎯 Next Steps

1. **Test the demo page** (`test-user-theories.html`)
2. **Review the implementation** on a real mythology page
3. **Deploy to all pages** using the automated script
4. **Gather feedback** from users
5. **Plan backend integration** for production use

## 📝 License

Part of the Eyes of Azrael project.

---

**Built with ❤️ by Claude Code**
